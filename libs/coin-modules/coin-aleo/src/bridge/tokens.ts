import BigNumber from "bignumber.js";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { Account, OperationType, TokenAccount } from "@ledgerhq/types-live";
import { encodeTokenAccountId, emptyHistoryCache } from "@ledgerhq/ledger-wallet-framework/account";
import { encodeOperationId } from "@ledgerhq/ledger-wallet-framework/operation";
import { mergeOps } from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import type { AleoOperation, AleoTokenAccount } from "../types/bridge";
import { apiClient } from "../network/api";
import { parseAmount } from "../logic/utils";
import { promiseAllBatched } from "@ledgerhq/live-promise";
import { log } from "@ledgerhq/logs";

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

    if (!parentCoinOp.subOperations.some(so => so.id === subAccountOp.id)) {
      parentCoinOp.subOperations = [...parentCoinOp.subOperations, subAccountOp];
    }

    const existing = tokenOperationsBySubAccountId.get(tokenAccountId) ?? [];
    if (!existing.some(so => so.id === subAccountOp.id)) {
      tokenOperationsBySubAccountId.set(tokenAccountId, [...existing, subAccountOp]);
    }
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
