import BigNumber from "bignumber.js";
import { log } from "@ledgerhq/logs";
import { promiseAllBatched } from "@ledgerhq/live-promise";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { Account, OperationType, TokenAccount } from "@ledgerhq/types-live";
import { encodeTokenAccountId, emptyHistoryCache } from "@ledgerhq/ledger-wallet-framework/account";
import { encodeOperationId } from "@ledgerhq/ledger-wallet-framework/operation";
import { mergeOps } from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import {
  EXPLORER_TRANSFER_TYPES,
  PRIVATE_TRANSFER_FUNCTIONS,
  SEMI_PUBLIC_TOKEN_FUNCTIONS,
} from "../constants";
import { parseAmount } from "../logic/utils";
import { apiClient } from "../network/api";
import { sdkClient } from "../network/sdk";
import { getTokenOutDetails } from "../network/utils";
import type {
  AleoOperation,
  AleoTokenAccount,
  AleoPrivateRecord,
  AleoPrivateTokenBalance,
  AleoDecryptedRecordResponse,
} from "../types";

interface TxOpEntry {
  amount: BigNumber;
  record: AleoPrivateRecord;
  programId: string;
  recipient?: string;
  fee?: BigNumber;
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
  coinOp.fee = fee;
}

function getAleoSubAccounts({
  ledgerAccountId,
  calTokens,
}: {
  ledgerAccountId: string;
  calTokens: Map<string, TokenCurrency>;
}): TokenAccount[] {
  return [...calTokens.values()].map(token =>
    buildTokenAccount(encodeTokenAccountId(ledgerAccountId, token), ledgerAccountId, token),
  );
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
    hasFailed: tokenOp.hasFailed ?? false,
  };
}

/**
 * Links raw token operations (as returned by listOperations, with `accountId = ledgerAccountId`)
 * to their parent public operations via `subOperations`, and builds a per-sub-account
 * operation map ready to be merged into sub-accounts.
 *
 * For each token operation:
 *  - The correct `TokenCurrency` is resolved from `extra.programId`.
 *  - A new operation is created with `accountId = encodeTokenAccountId(…)` and
 *    an appropriate IN/OUT type derived from senders/recipients vs the account address.
 *  - The new operation is attached as a `subOperation` of the matching coin operation
 *    (matched by hash). If no coin operation matches, a NONE parent is inserted.
 *
 * @returns updatedCoinOperations – coin ops with `subOperations` filled in.
 * @returns tokenOperationsBySubAccountId – map from token account id to its operations.
 */
function appendUniqueOperation<T extends { id: string }>(ops: T[], op: T): T[] {
  return ops.some(o => o.id === op.id) ? ops : [...ops, op];
}

export async function prepareTokenOperations({
  address,
  ledgerAccountId,
  publicOperations,
  tokenOperations,
  calTokens,
}: {
  address: string;
  ledgerAccountId: string;
  publicOperations: AleoOperation[];
  tokenOperations: AleoOperation[];
  calTokens: Map<string, TokenCurrency>;
}): Promise<{
  updatedCoinOperations: AleoOperation[];
  tokenOperationsBySubAccountId: Map<string, AleoOperation[]>;
}> {
  const tokenOperationsBySubAccountId = new Map<string, AleoOperation[]>();

  if (tokenOperations.length === 0) {
    return {
      updatedCoinOperations: publicOperations,
      tokenOperationsBySubAccountId,
    };
  }

  // shallow-copy public operations so we can mutate subOperations without side effects
  const updatedCoinOperations: CoinOperationWithSubOps[] = publicOperations.map(op => ({
    ...op,
    subOperations: op.subOperations ? [...op.subOperations] : [],
  }));

  const coinOpsByHash = new Map<string, CoinOperationWithSubOps>(
    updatedCoinOperations.map(op => [op.hash, op]),
  );

  for (const tokenOp of tokenOperations) {
    const programId = tokenOp.extra?.programId;
    if (!programId) continue;

    const tokenCurrency = calTokens.get(programId);
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

    parentCoinOp.subOperations = appendUniqueOperation(parentCoinOp.subOperations, subAccountOp);

    const existing = tokenOperationsBySubAccountId.get(tokenAccountId) ?? [];
    tokenOperationsBySubAccountId.set(
      tokenAccountId,
      appendUniqueOperation(existing, subAccountOp),
    );
  }

  return { updatedCoinOperations, tokenOperationsBySubAccountId };
}

function buildTokenAccount(
  id: string,
  parentId: string,
  token: TokenCurrency,
  balance: BigNumber = new BigNumber(0),
  creationDate: Date = new Date(),
): TokenAccount {
  return {
    type: "TokenAccount",
    id,
    parentId,
    token,
    balance,
    spendableBalance: balance,
    creationDate,
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
      if (isOps) {
        updates[name] = mergeOps(duplicatedAccount[name], newSubAccount[name]);
      } else if (newSubAccount[name] !== duplicatedAccount[name]) {
        // @ts-expect-error - TypeScript assumes all possible types could be assigned here
        updates[name] = newSubAccount[name];
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
  publicOperations,
  tokenOperations,
  calTokens,
  shouldSyncFromScratch,
  initialAccount,
}: {
  enableTokens: boolean;
  currency: CryptoCurrency;
  address: string;
  ledgerAccountId: string;
  publicOperations: AleoOperation[];
  tokenOperations: AleoOperation[];
  calTokens: Map<string, TokenCurrency>;
  shouldSyncFromScratch: boolean;
  initialAccount: Account | undefined;
}): Promise<{ updatedCoinOperations: AleoOperation[]; subAccounts: TokenAccount[] }> {
  // If tokens are disabled, we should clear any existing token sub-accounts and token related operations (ops having any subOperation)
  if (!enableTokens) {
    return {
      updatedCoinOperations: publicOperations.filter(op => (op.subOperations ?? []).length === 0),
      subAccounts: [],
    };
  }

  const { updatedCoinOperations, tokenOperationsBySubAccountId } = await prepareTokenOperations({
    address,
    ledgerAccountId,
    publicOperations,
    tokenOperations,
    calTokens,
  });

  const newSubAccounts = getAleoSubAccounts({ ledgerAccountId, calTokens }).map(subAccount => {
    const ops = tokenOperationsBySubAccountId.get(subAccount.id) ?? [];
    return { ...subAccount, operations: ops, operationsCount: ops.length };
  });

  const merged = shouldSyncFromScratch
    ? newSubAccounts
    : mergeSubAccounts(initialAccount, newSubAccounts);

  // Fetch fresh transparent balances for all merged sub-accounts in a single batched pass.
  // Covers both newly discovered accounts (in calTokens) and pre-existing ones with no
  // recent operations. On failure the entry is omitted and applyTransparentBalance falls
  // back to the previously stored transparentBalance.
  const freshTransparentById = new Map<string, BigNumber>();
  await promiseAllBatched(4, merged, async subAccount => {
    try {
      freshTransparentById.set(
        subAccount.id,
        parseAmount(
          await apiClient.getTokenBalance(currency, subAccount.token.contractAddress, address),
        ),
      );
    } catch (e) {
      log(
        "aleo/resolveTokenSubAccounts",
        `Failed to fetch balance for ${subAccount.token.contractAddress}: ${String(e)}`,
      );
    }
  });

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
 * Deduplicates private records by commitment and excludes non-transfer records (split, join, fee_private, etc.) that do not represent token movements.
 */
export function filterHistoryRecords(records: AleoPrivateRecord[]): AleoPrivateRecord[] {
  return [
    ...new Map(
      records
        .filter(record => PRIVATE_TRANSFER_FUNCTIONS.has(record.function_name))
        .map(record => [record.commitment, record]),
    ).values(),
  ];
}

/** Builds a single private AleoOperation from a per-transaction accumulator entry. */
export function buildPrivateTokenOp(
  tokenAccountId: string,
  txId: string,
  { amount, record, programId, recipient, fee }: TxOpEntry,
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
  const outRecipients = recipient ? [recipient] : [];
  const recipients = type === "OUT" ? outRecipients : [address];

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
      programId,
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

export function withPrivateBalance({
  subAccount,
  isExisting,
  balanceEntriesById,
  privateTokenOpsByAccountId,
}: {
  subAccount: TokenAccount;
  isExisting: boolean;
  balanceEntriesById: Map<string, AleoPrivateTokenBalance>;
  privateTokenOpsByAccountId: Map<string, AleoOperation[]>;
}): AleoTokenAccount {
  const entry = balanceEntriesById.get(subAccount.id);
  const privateBalance = entry?.balance ?? new BigNumber(0);
  const unspentRecords = entry?.unspentRecords ?? [];
  const aleoSubAccount = subAccount as AleoTokenAccount;
  const transparentBalance = isExisting
    ? (aleoSubAccount.transparentBalance ?? aleoSubAccount.balance)
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
    unspentPrivateRecords: unspentRecords,
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
export function patchTokenSubAccountOps(subAccounts: TokenAccount[]): TokenAccount[] {
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
 * Mutates `operations` in place (may push new FEES ops) and returns the parent coin operation.
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
        ...(privateOp.extra?.programId && { programId: privateOp.extra.programId }),
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
}): void {
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
}

function upsertTxEntry({
  txEntriesByToken,
  tokenAccountId,
  txId,
  entry,
}: {
  txEntriesByToken: Map<string, Map<string, TxOpEntry>>;
  tokenAccountId: string;
  txId: string;
  entry: TxOpEntry;
}): void {
  if (!txEntriesByToken.has(tokenAccountId)) txEntriesByToken.set(tokenAccountId, new Map());
  const txEntries = txEntriesByToken.get(tokenAccountId)!;
  const existing = txEntries.get(txId);
  if (existing) {
    existing.amount = existing.amount.plus(entry.amount);
  } else {
    txEntries.set(txId, entry);
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
  // Per-token operations built from all historical records (including spent).
  // Keyed by token account id → operations sorted descending by date.
  const privateTokenOpsByAccountId = new Map<string, AleoOperation[]>();
  const existingSubAccountIds = new Set(baseSubAccounts.map(sa => sa.id));
  const balanceEntriesById = new Map<string, AleoPrivateTokenBalance>();

  const extractAmount = (decrypted: AleoDecryptedRecordResponse): BigNumber => {
    const raw = decrypted.data?.amount ?? decrypted.data?.balance ?? decrypted.data?.microcredits;
    return parseAmount(raw ?? null);
  };

  // ── Phase 1: private balances from unspent records ───────────────────────────

  if (unspentPrivateRecords.length > 0) {
    await promiseAllBatched(4, unspentPrivateRecords, async record => {
      const tokenCurrency = calTokens.get(record.program_name);
      if (!tokenCurrency) return;

      const decrypted = await sdkClient.decryptRecord({
        currency,
        ciphertext: record.record_ciphertext,
        viewKey,
      });

      const amount = extractAmount(decrypted);

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

  // ── Phase 2: sub-account discovery and operation history from all historical records ──

  if (allPrivateRecords.length === 0) {
    return {
      privateTokenOpsByAccountId,
      subAccounts: baseSubAccounts.map(subAccount =>
        withPrivateBalance({
          subAccount,
          isExisting: true,
          balanceEntriesById,
          privateTokenOpsByAccountId,
        }),
      ),
    };
  }

  const newSubAccountMeta = new Map<string, { token: TokenCurrency; creationDate: Date }>();

  // Multiple records in the same tx are summed into one entry -> one operation per (token, tx).
  const txEntriesByToken = new Map<string, Map<string, TxOpEntry>>();
  const historyRecords = filterHistoryRecords(allPrivateRecords);

  await promiseAllBatched(4, historyRecords, async record => {
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
      const outDetails = await getTokenOutDetails({ currency, record, viewKey });
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
      amount = extractAmount(decrypted);
    }

    const tokenAccountId = encodeTokenAccountId(ledgerAccountId, tokenCurrency);

    if (!existingSubAccountIds.has(tokenAccountId)) {
      const recordDate = new Date(Number(record.block_timestamp) * 1000);
      const existingMeta = newSubAccountMeta.get(tokenAccountId);
      if (!existingMeta || recordDate < existingMeta.creationDate) {
        newSubAccountMeta.set(tokenAccountId, { token: tokenCurrency, creationDate: recordDate });
      }
    }

    upsertTxEntry({
      txEntriesByToken,
      tokenAccountId,
      txId: record.transaction_id.trim(),
      entry: {
        amount,
        record,
        programId: record.program_name,
        ...(recipient && { recipient }),
        ...(fee && { fee }),
      },
    });
  });

  // Build one operation per (token, transaction) from the entries.
  for (const [tokenAccountId, txEntries] of txEntriesByToken) {
    const ops = [...txEntries.entries()].map(([txId, entry]) =>
      buildPrivateTokenOp(tokenAccountId, txId, entry, address),
    );
    ops.sort((a, b) => b.date.getTime() - a.date.getTime());
    privateTokenOpsByAccountId.set(tokenAccountId, ops);
  }

  const newSubAccounts = [...newSubAccountMeta.entries()].map(([id, { token, creationDate }]) =>
    buildTokenAccount(id, ledgerAccountId, token, new BigNumber(0), creationDate),
  );

  const finalSubAccounts = [
    ...baseSubAccounts.map(subAccount =>
      withPrivateBalance({
        subAccount,
        isExisting: true,
        balanceEntriesById,
        privateTokenOpsByAccountId,
      }),
    ),
    ...newSubAccounts.map(subAccount =>
      withPrivateBalance({
        subAccount,
        isExisting: false,
        balanceEntriesById,
        privateTokenOpsByAccountId,
      }),
    ),
  ];
  return {
    subAccounts: finalSubAccounts,
    privateTokenOpsByAccountId,
  };
}
