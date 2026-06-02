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
import { EXPLORER_TRANSFER_TYPES, AMOUNT_ARG_INDEX } from "../constants";
import { mergeOps } from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import { promiseAllBatched } from "@ledgerhq/live-promise";
import { getCryptoAssetsStore } from "@ledgerhq/cryptoassets/state";
import type { AleoPrivateRecord } from "../types/api";

/** CAL lookup by Aleo program name (contract address). Missing programs are omitted. */
export async function getCalTokens({
  currencyId,
  programNames,
}: {
  currencyId: string;
  programNames: string[];
}): Promise<Map<string, TokenCurrency>> {
  const calTokens = new Map<string, TokenCurrency>();

  await promiseAllBatched(4, [...new Set(programNames)], async programName => {
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
  const normalized = balanceStr.trim().replace(/\.(private|public|constant)$/, "");

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
      parentCoinOp.id = encodeOperationId(ledgerAccountId, tokenOp.hash, "FEES");
      parentCoinOp.type = "FEES";
      parentCoinOp.value = tokenOp.fee;
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
 * For an outgoing (OUT) private token transfer, the spent input record's own `amount`
 * is the full pre-send balance — NOT the amount that was sent to the recipient.
 * Reads the actual sent amount from the transition inputs instead.
 *
 * Returns null if the transition data is unavailable or the input cannot be parsed,
 * in which case the caller should fall back to the record amount.
 */
async function getTokenOutAmountFromTransition({
  currency,
  record,
  viewKey,
}: {
  currency: CryptoCurrency;
  record: AleoPrivateRecord;
  viewKey: string;
}): Promise<BigNumber | null> {
  const txDetails = await apiClient.getTransactionById(currency, record.transaction_id.trim());
  const transition = txDetails.execution?.transitions[record.transition_index];

  if (!transition) return null;

  // For private_to_public the amount argument is already in plaintext at AMOUNT_ARG_INDEX.
  if (record.function_name === EXPLORER_TRANSFER_TYPES.PRIVATE_TO_PUBLIC) {
    const amountInput = transition.inputs[AMOUNT_ARG_INDEX] ?? null;
    if (!amountInput || !("value" in amountInput)) return null;
    return parseTokenBalance(amountInput.value);
  }

  // Fully private transfer: decrypt all inputs in parallel and pick the one whose
  // plaintext is a plain integer amount ("1u128", "500u64", etc.).
  const decryptedInputs = await Promise.all(
    transition.inputs.map(async (inp, idx) => {
      if (!("value" in inp) || !inp.value) return { idx, raw: inp };
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
        return { idx, raw: inp, decrypted: dec };
      } catch (e) {
        return { idx, raw: inp, error: String(e) };
      }
    }),
  );

  const amountEntry = decryptedInputs.find(
    entry => "decrypted" in entry && /^\d+u\d+/.test((entry.decrypted?.plaintext ?? "").trim()),
  );
  if (!amountEntry || !("decrypted" in amountEntry)) return null;

  return parseTokenBalance(amountEntry.decrypted!.plaintext);
}

type TxOpEntry = {
  amount: BigNumber;
  record: AleoPrivateRecord;
  tokenInfo: NonNullable<AleoOperationExtra["tokenInfo"]>;
};

/**
 * Deduplicates private records by commitment and excludes unspent change records
 * (sender === address, not yet re-spent) since those represent current balance only.
 */
export function filterHistoryRecords(
  records: AleoPrivateRecord[],
  address: string,
): AleoPrivateRecord[] {
  return [
    ...new Map(
      records.filter(r => r.spent || r.sender !== address).map(r => [r.commitment, r]),
    ).values(),
  ];
}

/** Builds a single private AleoOperation from a per-transaction accumulator entry. */
export function buildPrivateTokenOp(
  tokenAccountId: string,
  txId: string,
  { amount, record, tokenInfo }: TxOpEntry,
  address: string,
): AleoOperation {
  const type: OperationType = record.sender === address ? "OUT" : "IN";
  const senders = type === "OUT" ? [address] : [record.sender];
  const recipients = type === "OUT" ? [] : [address];
  return {
    id: encodeOperationId(tokenAccountId, txId, type),
    hash: txId,
    type,
    value: amount,
    fee: new BigNumber(0),
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

export function accumulateOp(
  opAccumulator: Map<string, Map<string, TxOpEntry>>,
  tokenAccountId: string,
  txId: string,
  amount: BigNumber,
  record: AleoPrivateRecord,
  tokenInfo: NonNullable<AleoOperationExtra["tokenInfo"]>,
): void {
  if (!opAccumulator.has(tokenAccountId)) opAccumulator.set(tokenAccountId, new Map());
  const txMap = opAccumulator.get(tokenAccountId)!;
  const existing = txMap.get(txId);
  if (existing) {
    existing.amount = existing.amount.plus(amount);
  } else {
    txMap.set(txId, { amount, record, tokenInfo });
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
}): Promise<{ subAccounts: AleoTokenAccount[] }> {
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
    if (record.sender === address) {
      // OUT: the spent input record's own amount is the full pre-send balance, not what
      // was sent. Read the actual sent amount from the transition inputs instead.
      const outAmount = await getTokenOutAmountFromTransition({ currency, record, viewKey });
      if (outAmount === null) {
        log(
          "aleo/buildSubAccountsFromPrivateRecords",
          `Could not determine OUT amount for record ${record.commitment} (tx ${record.transaction_id}), falling back to 0`,
        );
      }
      amount = outAmount ?? new BigNumber(0);
    } else {
      // IN: the received record's amount is correct.
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

    accumulateOp(opAccumulator, id, record.transaction_id.trim(), amount, record, {
      programId: record.program_name,
      tokenId: null,
    });
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
  };
}
