import BigNumber from "bignumber.js";
import { log } from "@ledgerhq/logs";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { Account, OperationType, TokenAccount } from "@ledgerhq/types-live";
import { encodeTokenAccountId, emptyHistoryCache } from "@ledgerhq/ledger-wallet-framework/account";
import { encodeOperationId } from "@ledgerhq/ledger-wallet-framework/operation";
import type { AleoOperation, AleoOperationExtra, AleoTokenAccount } from "../types/bridge";
import type { AleoPrivateTokenBalance } from "../types/logic";
import { apiClient } from "../network/api";
import { sdkClient } from "../network/sdk";
import {
  EXPLORER_TRANSFER_TYPES,
  PRIVATE_TRANSFER_FUNCTIONS,
  SEMI_PUBLIC_TOKEN_FUNCTIONS,
} from "../constants";
import { mergeOps } from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import { promiseAllBatched } from "@ledgerhq/live-promise";
import { getCryptoAssetsStore } from "@ledgerhq/cryptoassets/state";
import type { AleoPrivateRecord } from "../types/api";

function normalizeAleoPlaintext(v: string): string {
  return v.trim().replace(/\.(private|public|constant)$/, "");
}

function isAleoAddressPlaintext(v: string): boolean {
  return normalizeAleoPlaintext(v).toLowerCase().startsWith("aleo1");
}

function isAleoAmountPlaintext(v: string): boolean {
  return /^\d+u\d+$/.test(normalizeAleoPlaintext(v));
}

function promoteCoinOpToFees({
  coinOp,
  fee,
  ledgerAccountId,
  txHash,
}: {
  coinOp: AleoOperation;
  fee: BigNumber;
  ledgerAccountId: string;
  txHash: string;
}): void {
  coinOp.id = encodeOperationId(ledgerAccountId, txHash, "FEES");
  coinOp.type = "FEES";
  coinOp.value = fee;
}

/** CAL lookup by Aleo program name (contract address). Missing programs are omitted. */
export async function getCalTokens({
  currencyId,
  programNames,
}: {
  currencyId: string;
  programNames: string[];
}): Promise<Map<string, TokenCurrency>> {
  const calTokens = new Map<string, TokenCurrency>();
  const uniqueProgramNames = [...new Set(programNames)];

  await promiseAllBatched(4, uniqueProgramNames, async programName => {
    const token = await getCryptoAssetsStore().findTokenByAddressInCurrency(
      programName,
      currencyId,
    );

    if (token) {
      calTokens.set(programName, token);
    }
  });

  return calTokens;
}

/**
 * Parses Aleo token balance payloads into BigNumber.
 * Supports direct balances (e.g. "123u128", "123u128.private", "123u128.public").
 * Aleo decrypted record fields include a visibility suffix (.private/.public/.constant)
 * which is stripped before parsing.
 * Returns zero if the input is null or cannot be parsed.
 */
function parseTokenBalance(balanceStr: string | null): BigNumber {
  if (!balanceStr) return new BigNumber(0);

  // Strip Aleo visibility suffixes (.private, .public, .constant) that appear in decrypted records
  const normalized = normalizeAleoPlaintext(balanceStr);

  const directBalanceMatch = normalized.match(/^(\d+)u\d+$/);
  if (directBalanceMatch) {
    return new BigNumber(directBalanceMatch[1]);
  }

  return new BigNumber(0);
}

export async function getAleoSubAccounts({
  currency,
  ledgerAccountId,
  address,
  tokenOperations,
  calTokens,
}: {
  currency: CryptoCurrency;
  ledgerAccountId: string;
  address: string;
  tokenOperations: AleoOperation[];
  calTokens: Map<string, TokenCurrency>;
}): Promise<TokenAccount[]> {
  if (tokenOperations.length === 0 || calTokens.size === 0) return [];

  const results = await Promise.allSettled(
    [...calTokens.values()].map(async tokenCurrency => {
      const balance = parseTokenBalance(
        await apiClient.getProgramTokenBalance(currency, tokenCurrency.contractAddress, address),
      );

      const id = encodeTokenAccountId(ledgerAccountId, tokenCurrency);
      return buildTokenAccount(id, ledgerAccountId, tokenCurrency, balance);
    }),
  );

  return results.flatMap(r => (r.status === "fulfilled" && r.value !== null ? [r.value] : []));
}

type CoinOperationWithSubOps = AleoOperation & Required<Pick<AleoOperation, "subOperations">>;

function buildNoneParentOp(
  ledgerAccountId: string,
  tokenOp: AleoOperation,
): CoinOperationWithSubOps {
  return {
    id: encodeOperationId(ledgerAccountId, tokenOp.hash, "NONE"),
    hash: tokenOp.hash,
    type: "NONE",
    value: new BigNumber(0),
    fee: new BigNumber(0),
    senders: [],
    recipients: [],
    blockHeight: tokenOp.blockHeight,
    blockHash: tokenOp.blockHash,
    accountId: ledgerAccountId,
    date: tokenOp.date,
    extra: {
      functionId: tokenOp.extra?.functionId ?? "",
      transactionType: tokenOp.extra?.transactionType ?? "public",
    },
    subOperations: [],
    nftOperations: [],
    internalOperations: [],
    hasFailed: false,
  };
}

/**
 * Links raw token operations (as returned by listOperations, with `accountId = ledgerAccountId`)
 * to their parent coin operations via `subOperations`, and builds a per-sub-account
 * operation map ready to be merged into sub-accounts.
 *
 * For each token operation:
 *  - The correct `TokenCurrency` is resolved from `extra.tokenInfo`.
 *  - A new operation is created with `accountId = encodeTokenAccountId(…)` and
 *    an appropriate IN/OUT type derived from senders/recipients vs the account address.
 *  - The new operation is attached as a `subOperation` of the matching coin operation
 *    (matched by hash). If no coin operation matches, a NONE parent is inserted.
 *
 * @returns updatedCoinOperations – coin ops with `subOperations` filled in.
 * @returns tokenOperationsBySubAccountId – map from token account id to its operations.
 */
export async function prepareTokenOperations({
  address,
  ledgerAccountId,
  coinOperations,
  tokenOperations,
  calTokens,
}: {
  address: string;
  ledgerAccountId: string;
  coinOperations: AleoOperation[];
  tokenOperations: AleoOperation[];
  calTokens: Map<string, TokenCurrency>;
}): Promise<{
  updatedCoinOperations: AleoOperation[];
  tokenOperationsBySubAccountId: Map<string, AleoOperation[]>;
}> {
  const tokenOperationsBySubAccountId = new Map<string, AleoOperation[]>();

  if (tokenOperations.length === 0) {
    return {
      updatedCoinOperations: coinOperations,
      tokenOperationsBySubAccountId,
    };
  }

  // shallow-copy coin operations so we can mutate subOperations without side effects
  const updatedCoinOperations: CoinOperationWithSubOps[] = coinOperations.map(op => ({
    ...op,
    subOperations: op.subOperations ? [...op.subOperations] : [],
  }));

  const coinOpsByHash = new Map<string, CoinOperationWithSubOps>(
    updatedCoinOperations.map(op => [op.hash, op]),
  );

  for (const tokenOp of tokenOperations) {
    const tokenInfo = tokenOp.extra?.tokenInfo;
    if (!tokenInfo) continue;

    const tokenCurrency = calTokens.get(tokenInfo.programId);
    if (!tokenCurrency) continue;

    const tokenAccountId = encodeTokenAccountId(ledgerAccountId, tokenCurrency);

    // Derive IN/OUT for the sub-account from the raw operation's senders/recipients.
    // The coin op has type NONE for token-program transactions; the sub-account needs
    // a meaningful direction.
    const type: OperationType = tokenOp.recipients.includes(address) ? "IN" : "OUT";

    const subAccountOp: AleoOperation = {
      ...tokenOp,
      id: encodeOperationId(tokenAccountId, tokenOp.hash, type),
      accountId: tokenAccountId,
      type,
    };

    // Get or create the single parent coin op for this transaction hash.
    let parentCoinOp = coinOpsByHash.get(tokenOp.hash);
    if (!parentCoinOp) {
      parentCoinOp = buildNoneParentOp(ledgerAccountId, tokenOp);
      updatedCoinOperations.push(parentCoinOp);
      coinOpsByHash.set(tokenOp.hash, parentCoinOp);
    }

    // For outgoing token transfers, promote the parent to a FEES op so the native
    // account history shows the fee cost rather than a valueless NONE entry.
    // Only promotes once per hash — idempotent if multiple OUT sub-ops share a hash.
    if (type === "OUT" && parentCoinOp.type !== "FEES") {
      promoteCoinOpToFees({
        coinOp: parentCoinOp,
        fee: tokenOp.fee,
        ledgerAccountId,
        txHash: tokenOp.hash,
      });
    }

    parentCoinOp.subOperations = [...parentCoinOp.subOperations, subAccountOp];

    const existing = tokenOperationsBySubAccountId.get(tokenAccountId) ?? [];
    tokenOperationsBySubAccountId.set(tokenAccountId, [...existing, subAccountOp]);
  }

  return { updatedCoinOperations, tokenOperationsBySubAccountId };
}

function buildTokenAccount(
  id: string,
  parentId: string,
  token: TokenCurrency,
  balance: BigNumber = new BigNumber(0),
): TokenAccount {
  return {
    type: "TokenAccount",
    id,
    parentId,
    token,
    balance,
    spendableBalance: balance,
    creationDate: new Date(),
    operations: [],
    operationsCount: 0,
    pendingOperations: [],
    balanceHistoryCache: emptyHistoryCache,
    swapHistory: [],
  };
}

/**
 * List of properties of a sub account that can be updated when 2 "identical" accounts are found
 */
const updatableSubAccountProperties = [
  { name: "balance", isOps: false },
  { name: "spendableBalance", isOps: false },
  { name: "balanceHistoryCache", isOps: false },
  { name: "operations", isOps: true },
  { name: "pendingOperations", isOps: true },
] as const satisfies { name: string; isOps: boolean }[];

/**
 * In charge of smartly merging sub accounts while maintaining references as much as possible
 */
export const mergeSubAccounts = (
  initialAccount: Account | undefined,
  newSubAccounts: TokenAccount[],
): Array<TokenAccount> => {
  const oldSubAccounts: Array<TokenAccount> | undefined = initialAccount?.subAccounts;

  if (!oldSubAccounts) {
    return newSubAccounts;
  }

  const oldSubAccountsById: Record<string, TokenAccount> = Object.fromEntries(
    oldSubAccounts.map(a => [a.id, a]),
  );

  // looping through new sub accounts to compare them with already existing ones
  // already existing will be updated if necessary (see `updatableSubAccountProperties`)
  // new sub accounts will be added/pushed after already existing
  const newSubAccountsToAdd: TokenAccount[] = [];
  for (const newSubAccount of newSubAccounts) {
    const duplicatedAccount: TokenAccount | undefined = oldSubAccountsById[newSubAccount.id];

    if (!duplicatedAccount) {
      newSubAccountsToAdd.push(newSubAccount);
      continue;
    }

    const updates: Partial<TokenAccount> = {};
    for (const { name, isOps } of updatableSubAccountProperties) {
      if (!isOps) {
        if (newSubAccount[name] !== duplicatedAccount[name]) {
          // @ts-expect-error - TypeScript assumes all possible types could be assigned here
          updates[name] = newSubAccount[name];
        }
      } else {
        updates[name] = mergeOps(duplicatedAccount[name], newSubAccount[name]);
      }
    }

    // update the operationsCount in case the mergeOps changed it
    updates.operationsCount =
      updates.operations?.length || duplicatedAccount?.operations?.length || 0;

    // modify the map with the updated sub account with a new ref
    oldSubAccountsById[newSubAccount.id!] = {
      ...duplicatedAccount,
      ...updates,
    };
  }

  const updatedSubAccounts = Object.values(oldSubAccountsById);

  return [...updatedSubAccounts, ...newSubAccountsToAdd];
};

/** Merges transparent + private balances into a sub-account, picking fresh transparent from the API map. */
export function applyTransparentBalance(
  subAccount: TokenAccount,
  freshTransparentById: Map<string, BigNumber>,
): AleoTokenAccount {
  const aleoSubAccount = subAccount as AleoTokenAccount;
  const transparentBalance =
    freshTransparentById.get(subAccount.id) ??
    aleoSubAccount.transparentBalance ??
    subAccount.balance;
  const privateBalance = aleoSubAccount.privateBalance ?? null;
  const total = transparentBalance.plus(privateBalance ?? 0);
  return {
    ...subAccount,
    transparentBalance,
    privateBalance,
    unspentPrivateRecords: aleoSubAccount.unspentPrivateRecords ?? null,
    balance: total,
    spendableBalance: total,
  };
}

/**
 * Prepares sub-accounts and the updated coin operations for a public sync cycle.
 *
 * Combines prepareTokenOperations, getAleoSubAccounts and mergeSubAccounts into
 * a single call so callers don't need a mutable variable to capture the updated
 * coin operations alongside the sub-accounts.
 *
 * @returns updatedCoinOperations – coin operations with subOperations attached.
 * @returns subAccounts – merged token sub-accounts ready to be stored on the account.
 */
export async function resolveTokenSubAccounts({
  enableTokens,
  currency,
  address,
  ledgerAccountId,
  coinOperations,
  tokenOperations,
  calTokens,
  shouldSyncFromScratch,
  initialAccount,
}: {
  enableTokens: boolean;
  currency: CryptoCurrency;
  address: string;
  ledgerAccountId: string;
  coinOperations: AleoOperation[];
  tokenOperations: AleoOperation[];
  calTokens: Map<string, TokenCurrency>;
  shouldSyncFromScratch: boolean;
  initialAccount: Account | undefined;
}): Promise<{ updatedCoinOperations: AleoOperation[]; subAccounts: TokenAccount[] }> {
  // If tokens are disabled, we should clear any existing token sub-accounts and token related operations (ops having any subOperation)
  if (!enableTokens) {
    return {
      updatedCoinOperations: coinOperations.filter(op => (op.subOperations ?? []).length === 0),
      subAccounts: [],
    };
  }

  const { updatedCoinOperations, tokenOperationsBySubAccountId } = await prepareTokenOperations({
    address,
    ledgerAccountId,
    coinOperations,
    tokenOperations,
    calTokens,
  });

  const fetchedSubAccounts = await getAleoSubAccounts({
    currency,
    ledgerAccountId,
    address,
    tokenOperations,
    calTokens,
  });

  const newSubAccounts = fetchedSubAccounts.map(subAccount => {
    const ops = tokenOperationsBySubAccountId.get(subAccount.id) ?? [];
    return { ...subAccount, operations: ops, operationsCount: ops.length };
  });

  // Map of fresh transparent balances from the API, keyed by sub-account id.
  // Used below to ensure we never confuse `balance` (may be total) with transparentBalance.
  const freshTransparentById = new Map(newSubAccounts.map(sa => [sa.id, sa.balance]));

  const merged = shouldSyncFromScratch
    ? newSubAccounts
    : mergeSubAccounts(initialAccount, newSubAccounts);

  // For each merged sub-account:
  //   - matched accounts: use fresh transparent from API
  //   - unmatched (dropped from current ops window): use stored transparentBalance to avoid
  //     treating the previous total as the transparent base and double-counting private balance
  const subAccounts: TokenAccount[] = merged.map(sa =>
    applyTransparentBalance(sa, freshTransparentById),
  );

  return { updatedCoinOperations, subAccounts };
}

/**
 * Builds token sub-accounts discovered from private records and computes their
 * private balances from unspent records in a single pass. Also builds private
 * transaction history for each token sub-account from all historical records.
 *
 * - `allPrivateRecords`: used for sub-account discovery, operation history, and
 *   (when spent records are present) full transaction history.
 * - `unspentPrivateRecords`: used for balance computation — decrypted and summed per token.
 * - `baseSubAccounts`: existing token sub-accounts (e.g. from public sync) whose
 *   private balance and operation fields will be updated.
 * - `address`: the account address, used to populate operation recipients.
 *
 * Returns `subAccounts`: the merged list of all AleoTokenAccounts with private
 * balances, transparent balances, unspent records, and private operations applied.
 */

/**
 * For an outgoing (OUT) private token transfer, reads both the transferred amount and
 * the recipient address from the transition inputs. The spent input record's own
 * `amount` is the full pre-send balance — NOT the amount sent.
 *
 * Returns null fields when the transition data is unavailable or cannot be parsed;
 * callers should fall back to 0 for amount and omit the recipient.
 */
async function getTokenOutDetailsFromTransition({
  currency,
  record,
  viewKey,
}: {
  currency: CryptoCurrency;
  record: AleoPrivateRecord;
  viewKey: string;
}): Promise<{ amount: BigNumber | null; recipient: string | null; fee: BigNumber }> {
  const txDetails = await apiClient.getTransactionById(currency, record.transaction_id.trim());
  const fee = new BigNumber(txDetails.fee_value);
  const transition = txDetails.execution?.transitions[record.transition_index];

  if (!transition)
    return {
      amount: null,
      recipient: null,
      fee,
    };

  // Collect all plaintext values from inputs (strip visibility suffixes).
  // transfer_private_to_public and many token programs expose the recipient address
  // and (for Priv2Pub) the amount directly in plaintext, so scan these first.
  const plaintexts = transition.inputs.flatMap(inp =>
    "value" in inp && inp.value ? [normalizeAleoPlaintext(inp.value)] : [],
  );
  const recipient = plaintexts.find(isAleoAddressPlaintext) ?? null;

  // For private_to_public the amount argument is already in plaintext at AMOUNT_ARG_INDEX.
  if (record.function_name === EXPLORER_TRANSFER_TYPES.PRIVATE_TO_PUBLIC) {
    // Amount is already in plaintext — scan inputs by pattern instead of assuming a
    // fixed argument index (token programs may differ from credits.aleo).
    const amountStr = plaintexts.find(isAleoAmountPlaintext) ?? null;
    return { amount: amountStr ? parseTokenBalance(amountStr) : null, recipient, fee };
  }

  // Fully private transfer: decrypt all inputs in parallel, then extract amount
  // and (if not yet found in plaintext) the recipient address.
  const decryptedPlaintexts = (
    await Promise.all(
      transition.inputs.map(async (inp, idx) => {
        const hasValue = "value" in inp && inp.value;
        if (!hasValue) return null;

        try {
          const dec = await sdkClient.decryptCiphertext({
            currency,
            ciphertext: inp.value,
            tpk: transition.tpk,
            viewKey,
            programId: record.program_name,
            functionName: record.function_name,
            outputIndex: idx,
          });
          return dec.plaintext;
        } catch {
          return null;
        }
      }),
    )
  ).filter((p): p is string => p !== null);

  const amountStr = decryptedPlaintexts.find(isAleoAmountPlaintext) ?? null;
  const resolvedRecipient =
    recipient ??
    decryptedPlaintexts.map(normalizeAleoPlaintext).find(isAleoAddressPlaintext) ??
    null;

  return {
    amount: amountStr ? parseTokenBalance(amountStr) : null,
    recipient: resolvedRecipient,
    fee,
  };
}

type TxOpEntry = {
  amount: BigNumber;
  record: AleoPrivateRecord;
  tokenInfo: NonNullable<AleoOperationExtra["tokenInfo"]>;
  recipient?: string;
  fee?: BigNumber;
};

/**
 * Deduplicates private records by commitment, excludes unspent change records
 * (sender === address, not yet re-spent), and excludes non-transfer records
 * (split, join, fee_private, etc.) that do not represent token movements.
 */
export function filterHistoryRecords(
  records: AleoPrivateRecord[],
  address: string,
): AleoPrivateRecord[] {
  return [
    ...new Map(
      records
        .filter(record => {
          if (!PRIVATE_TRANSFER_FUNCTIONS.has(record.function_name)) return false;
          if (record.spent || record.sender !== address) return true;
          // * transfer_public_to_private: sender === address means you sent public -> private to yourself (self-transfer).
          // the private output record IS the IN side — include it.
          // * transfer_private_to_public: sender === address means this is the change record from a private -> public transfer.
          // include it so the OUT side appears in the token sub-account.
          return SEMI_PUBLIC_TOKEN_FUNCTIONS.has(record.function_name);
        })
        .map(record => [record.commitment, record]),
    ).values(),
  ];
}

/** Builds a single private AleoOperation from a per-transaction accumulator entry. */
export function buildPrivateTokenOp(
  tokenAccountId: string,
  txId: string,
  { amount, record, tokenInfo, recipient, fee }: TxOpEntry,
  address: string,
): AleoOperation {
  // For transfer_public_to_private, the private record is the IN side even when
  // sender === address — you received your own public tokens as private.
  // For all other functions, sender === address means you sent tokens OUT.
  const isPrivateSelfTransfer =
    record.function_name === EXPLORER_TRANSFER_TYPES.PUBLIC_TO_PRIVATE && record.sender === address;
  let type: OperationType = record.sender === address ? "OUT" : "IN";
  if (isPrivateSelfTransfer) {
    type = "IN";
  }

  const senders = type === "OUT" ? [address] : [record.sender];
  const recipients = type === "OUT" ? (recipient ? [recipient] : []) : [address];

  return {
    id: encodeOperationId(tokenAccountId, txId, type),
    hash: txId,
    type,
    value: amount,
    fee: fee ?? new BigNumber(0),
    senders,
    recipients,
    blockHeight: record.block_height,
    blockHash: "",
    accountId: tokenAccountId,
    date: new Date(Number(record.block_timestamp) * 1000),
    extra: {
      functionId: record.function_name,
      transactionType: "private",
      tokenInfo,
    },
    hasFailed: false,
    subOperations: [],
    nftOperations: [],
    internalOperations: [],
  };
}

export function getOrCreateBalanceEntry(
  balanceEntriesById: Map<string, AleoPrivateTokenBalance>,
  id: string,
  contractAddress: string,
): AleoPrivateTokenBalance {
  let entry = balanceEntriesById.get(id);
  if (!entry) {
    entry = { id, contractAddress, balance: new BigNumber(0), unspentRecords: [] };
    balanceEntriesById.set(id, entry);
  }
  return entry;
}

export function withPrivateBalance(
  subAccount: TokenAccount,
  isExisting: boolean,
  balanceEntriesById: Map<string, AleoPrivateTokenBalance>,
  privateTokenOpsByAccountId: Map<string, AleoOperation[]>,
): AleoTokenAccount {
  const entry = balanceEntriesById.get(subAccount.id);
  const privateBalance = entry?.balance ?? new BigNumber(0);
  const unspentRecs = entry?.unspentRecords ?? [];
  const aleoSubAccount = subAccount as AleoTokenAccount;
  const transparentBalance = isExisting
    ? (aleoSubAccount.transparentBalance ?? subAccount.balance)
    : new BigNumber(0);
  const total = transparentBalance.plus(privateBalance);
  const newPrivateOps = privateTokenOpsByAccountId.get(subAccount.id) ?? [];
  const mergedOps =
    isExisting && subAccount.operations.length > 0
      ? (mergeOps(subAccount.operations, newPrivateOps) as AleoOperation[])
      : newPrivateOps;
  return {
    ...subAccount,
    transparentBalance,
    privateBalance,
    unspentPrivateRecords: unspentRecs,
    balance: total,
    spendableBalance: total,
    operations: mergedOps,
    operationsCount: mergedOps.length,
  };
}

/**
 * Patches public token sub-account ops for semi-transparent transfers.
 *
 * After `buildSubAccountsFromPrivateRecords` merges private ops into each
 * sub-account, some public ops (transfer_public_to_private / transfer_private_to_public)
 * may still be missing senders or recipients because the other side of the transfer
 * was private at parse time.
 *
 * For each such op, look for a private op with the same transaction hash already
 * present in the same sub-account's operations.  If one exists, copy the missing
 * senders/recipients from it and mark the op as patched.  If no private op is
 * found for that hash, skip — we have no data to fill in.
 */
export function patchTokenSubAccountOps({
  subAccounts,
}: {
  subAccounts: TokenAccount[];
}): TokenAccount[] {
  return subAccounts.map(subAccount => {
    const ops = subAccount.operations as AleoOperation[];

    // Index ops that have private transactionType by hash so we can look them up in O(1).
    const privateOpsByHash = new Map<string, AleoOperation[]>();

    for (const op of ops) {
      if (op.extra?.transactionType !== "private") continue;
      const bucket = privateOpsByHash.get(op.hash) ?? [];
      bucket.push(op);
      privateOpsByHash.set(op.hash, bucket);
    }

    const patchedOps = ops.map(op => {
      if (!SEMI_PUBLIC_TOKEN_FUNCTIONS.has(op.extra?.functionId) || op.extra?.patched) return op;

      // Treat an empty array or an array of only empty strings as "missing".
      const missingSenders = op.senders.every(sender => !sender);
      const missingRecipients = op.recipients.every(recipient => !recipient);
      if (!missingSenders && !missingRecipients) return op;

      // Only patch when we already have a private op for this hash — no API calls.
      const privateOps = privateOpsByHash.get(op.hash);
      if (!privateOps?.length) return op;

      const privateOp =
        privateOps.find(
          candidate =>
            (!missingSenders || candidate.senders.some(Boolean)) &&
            (!missingRecipients || candidate.recipients.some(Boolean)),
        ) ?? privateOps[0];

      return {
        ...op,
        senders: missingSenders && privateOp.senders.some(Boolean) ? privateOp.senders : op.senders,
        recipients:
          missingRecipients && privateOp.recipients.some(Boolean)
            ? privateOp.recipients
            : op.recipients,
        extra: { ...op.extra, patched: true },
      };
    });

    return { ...subAccount, operations: patchedOps };
  });
}

/**
 * For each private token OUT op, ensures a FEES parent coin op exists in `operations`:
 * - creates one if missing (private fee paid off-chain, no public coin op exists)
 * - promotes an existing non-FEES op to FEES type
 * - fills in empty senders (fee_public ops from the public API lack sender data)
 * Then attaches every private token op as a subOperation of its parent.
 *
 * Mutates `operations` in place (may push new FEES ops) and returns it.
 */
function ensureFeesParentCoinOp({
  privateOp,
  coinOpsByHash,
  operations,
  ledgerAccountId,
  address,
}: {
  privateOp: AleoOperation;
  coinOpsByHash: Map<string, AleoOperation>;
  operations: AleoOperation[];
  ledgerAccountId: string;
  address: string;
}): AleoOperation {
  let coinOp = coinOpsByHash.get(privateOp.hash);

  if (!coinOp) {
    coinOp = {
      ...privateOp,
      id: encodeOperationId(ledgerAccountId, privateOp.hash, "FEES"),
      accountId: ledgerAccountId,
      type: "FEES",
      value: privateOp.fee,
      blockHash: privateOp.blockHash ?? "",
      extra: {
        functionId: privateOp.extra?.functionId ?? "",
        transactionType: "private" as const,
      },
      subOperations: [],
      nftOperations: [],
      internalOperations: [],
    };
    operations.push(coinOp);
    coinOpsByHash.set(privateOp.hash, coinOp);
  } else if (coinOp.type !== "FEES") {
    promoteCoinOpToFees({
      coinOp,
      fee: privateOp.fee,
      ledgerAccountId,
      txHash: privateOp.hash,
    });
  }

  if (coinOp.senders.every(sender => !sender)) {
    coinOp.senders = [address];
  }

  return coinOp;
}

export function attachPrivateTokenOpsToParent({
  operations,
  privateTokenOpsByAccountId,
  ledgerAccountId,
  address,
}: {
  operations: AleoOperation[];
  privateTokenOpsByAccountId: Map<string, AleoOperation[]>;
  ledgerAccountId: string;
  address: string;
}): AleoOperation[] {
  const coinOpsByHash = new Map<string, AleoOperation>(operations.map(op => [op.hash, op]));

  for (const privateOps of privateTokenOpsByAccountId.values()) {
    for (const privateOp of privateOps) {
      const parentCoinOp =
        privateOp.type === "OUT"
          ? ensureFeesParentCoinOp({
              privateOp,
              coinOpsByHash,
              operations,
              ledgerAccountId,
              address,
            })
          : coinOpsByHash.get(privateOp.hash);

      if (!parentCoinOp) continue;

      if (!(parentCoinOp.subOperations ?? []).some(so => so.id === privateOp.id)) {
        parentCoinOp.subOperations = [...(parentCoinOp.subOperations ?? []), privateOp];
      }
    }
  }

  return operations;
}

export function accumulateOp(
  opAccumulator: Map<string, Map<string, TxOpEntry>>,
  tokenAccountId: string,
  txId: string,
  amount: BigNumber,
  record: AleoPrivateRecord,
  tokenInfo: NonNullable<AleoOperationExtra["tokenInfo"]>,
  recipient?: string,
  fee?: BigNumber,
): void {
  if (!opAccumulator.has(tokenAccountId)) opAccumulator.set(tokenAccountId, new Map());
  const txMap = opAccumulator.get(tokenAccountId)!;
  const existing = txMap.get(txId);
  if (existing) {
    existing.amount = existing.amount.plus(amount);
  } else {
    txMap.set(txId, {
      amount,
      record,
      tokenInfo,
      ...(typeof recipient === "string" && { recipient }),
      ...(!!fee && { fee }),
    });
  }
}

export async function buildSubAccountsFromPrivateRecords({
  currency,
  ledgerAccountId,
  allPrivateRecords,
  unspentPrivateRecords,
  baseSubAccounts,
  viewKey,
  address,
  calTokens,
}: {
  currency: CryptoCurrency;
  ledgerAccountId: string;
  allPrivateRecords: AleoPrivateRecord[];
  unspentPrivateRecords: AleoPrivateRecord[];
  baseSubAccounts: TokenAccount[];
  viewKey: string;
  address: string;
  calTokens: Map<string, TokenCurrency>;
}): Promise<{
  subAccounts: AleoTokenAccount[];
  privateTokenOpsByAccountId: Map<string, AleoOperation[]>;
}> {
  const existingSubAccountIds = new Set(baseSubAccounts.map(sa => sa.id));

  const balanceEntriesById = new Map<string, AleoPrivateTokenBalance>();
  // Per-token operations built from all historical records (including spent).
  // Keyed by token account id → operations sorted descending by date.
  const privateTokenOpsByAccountId = new Map<string, AleoOperation[]>();

  if (unspentPrivateRecords.length > 0) {
    await promiseAllBatched(4, unspentPrivateRecords, async record => {
      const tokenCurrency = calTokens.get(record.program_name);
      if (!tokenCurrency) return;

      const decrypted = await sdkClient.decryptRecord({
        currency,
        ciphertext: record.record_ciphertext,
        viewKey,
      });
      const rawAmount =
        decrypted.data?.amount ?? decrypted.data?.balance ?? decrypted.data?.microcredits;
      const amount = parseTokenBalance(rawAmount ?? null);

      const id = encodeTokenAccountId(ledgerAccountId, tokenCurrency);
      const entry = getOrCreateBalanceEntry(balanceEntriesById, id, tokenCurrency.contractAddress);
      entry.balance = entry.balance.plus(amount);
      entry.unspentRecords.push({
        ...record,
        microcredits: amount.toString(),
        decryptedData: decrypted,
      });
    });
  }

  // ── Sub-account discovery and operation history from all historical records ─

  if (allPrivateRecords.length === 0) {
    return {
      subAccounts: baseSubAccounts.map(sa =>
        withPrivateBalance(sa, true, balanceEntriesById, privateTokenOpsByAccountId),
      ),
      privateTokenOpsByAccountId,
    };
  }

  const newSubAccounts: TokenAccount[] = [];
  const seenIds = new Set<string>();

  // Per-token, per-transaction accumulator used to build one operation per tx.
  // Multiple records from the same tx for the same token have their amounts summed.
  const opAccumulator = new Map<string, Map<string, TxOpEntry>>();

  const uniqueAllRecords = filterHistoryRecords(allPrivateRecords, address);

  await promiseAllBatched(4, uniqueAllRecords, async record => {
    const tokenCurrency = calTokens.get(record.program_name);
    if (!tokenCurrency) return;

    let amount: BigNumber;
    let recipient: string | undefined;
    let fee: BigNumber | undefined;
    // Private self-transfer: the private record is the received output — decrypt it directly.
    // All other sender===address cases are OUT events (Priv2Pub change record, etc.) where
    // the record amount is the pre-send balance, so we read the transferred amount from inputs.
    const isOutgoingRecord =
      record.sender === address &&
      record.function_name !== EXPLORER_TRANSFER_TYPES.PUBLIC_TO_PRIVATE;

    if (isOutgoingRecord) {
      // OUT: read the actual sent amount and recipient address from the transition inputs.
      const outDetails = await getTokenOutDetailsFromTransition({ currency, record, viewKey });
      if (outDetails.amount === null) {
        log(
          "aleo/buildSubAccountsFromPrivateRecords",
          `Could not determine OUT amount for record ${record.commitment} (tx ${record.transaction_id}), falling back to 0`,
        );
      }
      amount = outDetails.amount ?? new BigNumber(0);
      recipient = outDetails.recipient ?? undefined;
      fee = outDetails.fee;
    } else {
      // IN (or Private self-transfer): the record itself contains the correct received amount.
      const decrypted = await sdkClient.decryptRecord({
        currency,
        ciphertext: record.record_ciphertext,
        viewKey,
      });
      const rawAmount =
        decrypted.data?.amount ?? decrypted.data?.balance ?? decrypted.data?.microcredits;
      amount = parseTokenBalance(rawAmount ?? null);
    }

    const id = encodeTokenAccountId(ledgerAccountId, tokenCurrency);

    if (!existingSubAccountIds.has(id) && !seenIds.has(id)) {
      seenIds.add(id);
      newSubAccounts.push(buildTokenAccount(id, ledgerAccountId, tokenCurrency));
    }

    accumulateOp(
      opAccumulator,
      id,
      record.transaction_id.trim(),
      amount,
      record,
      {
        programId: record.program_name,
        tokenId: null,
      },
      recipient,
      fee,
    );
  });

  // Build one operation per (token, transaction) from the accumulator.
  for (const [tokenAccountId, txMap] of opAccumulator) {
    const ops = [...txMap.entries()].map(([txId, entry]) =>
      buildPrivateTokenOp(tokenAccountId, txId, entry, address),
    );
    ops.sort((a, b) => b.date.getTime() - a.date.getTime());
    privateTokenOpsByAccountId.set(tokenAccountId, ops);
  }

  const finalSubAccounts = [
    ...baseSubAccounts.map(sa =>
      withPrivateBalance(sa, true, balanceEntriesById, privateTokenOpsByAccountId),
    ),
    ...newSubAccounts.map(sa =>
      withPrivateBalance(sa, false, balanceEntriesById, privateTokenOpsByAccountId),
    ),
  ];
  return {
    subAccounts: finalSubAccounts,
    privateTokenOpsByAccountId,
  };
}
