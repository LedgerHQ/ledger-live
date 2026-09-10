import BigNumber from "bignumber.js";
import {
  emptyHistoryCache,
  encodeTokenAccountId,
} from "@ledgerhq/ledger-wallet-framework/account/index";
import type { TokenCurrency } from "@domain/entity-currency-token";
import type { SyncConfig, TokenAccount } from "@ledgerhq/types-live";
import { encodeOperationId } from "@ledgerhq/ledger-wallet-framework/operation";
import { AssetInfo, Balance } from "@ledgerhq/coin-module-framework/api/types";
import { mergeOps } from "../jsHelpers";
import { cleanedOperation } from "./utils";
import { OperationCommon } from "./types";

function buildTokenAccount({
  parentAccountId,
  assetBalance,
  token,
  operations,
}: {
  parentAccountId: string;
  assetBalance: Balance;
  token: TokenCurrency;
  operations: OperationCommon[];
}): TokenAccount {
  const id = encodeTokenAccountId(parentAccountId, token);
  const balance = new BigNumber(assetBalance.value.toString() || "0");

  // TODO: recheck this logic
  const spendableBalance = new BigNumber(assetBalance.value.toString()).minus(
    new BigNumber(assetBalance.locked?.toString() || "0"),
  );

  const tokenOperations = operations.map(op =>
    cleanedOperation({
      ...op,
      id: encodeOperationId(id, op.hash, op.extra?.ledgerOpType),
      accountId: id,
      type: op.extra?.ledgerOpType,
      contract: token.contractAddress,
      value: op.extra?.assetAmount ? new BigNumber(op.extra?.assetAmount) : op.value,
      senders: op.extra?.assetSenders ?? op.senders,
      recipients: op.extra?.assetRecipients ?? op.recipients,
    }),
  );

  return {
    type: "TokenAccount",
    id,
    parentId: parentAccountId,
    token,
    operationsCount: operations.length,
    operations: tokenOperations,
    pendingOperations: [],
    balance,
    spendableBalance: spendableBalance,
    swapHistory: [],
    // Oldest of the operations passed in -- under an operation-history bound this can be more
    // recent than the token's real first activity, since older operations were never fetched.
    // Accepted as cosmetic: nothing downstream treats creationDate as a completeness guarantee.
    creationDate: operations.length > 0 ? operations[operations.length - 1].date : new Date(),
    balanceHistoryCache: emptyHistoryCache, // calculated in the jsHelpers
  };
}

/**
 * Groups `operations` once by (lowercased `assetReference`, `assetOwner`) so that each token's
 * matching operations can be looked up instead of refiltering the whole list. Only operations
 * whose `extra.assetReference` is a string are indexed here: the existing predicate lowercases
 * only when *both* sides are strings, so an op whose reference isn't a string can never match a
 * string-typed balance reference (and vice versa) — see `nonStringReferenceOperations` below,
 * which keeps those out of the index and lets them be matched by the original predicate.
 */
function indexOperationsByAssetReference(operations: OperationCommon[]): {
  byLowercasedReference: Map<string, Map<unknown, OperationCommon[]>>;
  nonStringReferenceOperations: OperationCommon[];
} {
  const byLowercasedReference = new Map<string, Map<unknown, OperationCommon[]>>();
  const nonStringReferenceOperations: OperationCommon[] = [];

  for (const op of operations) {
    const assetReference = op.extra.assetReference;
    if (typeof assetReference !== "string") {
      nonStringReferenceOperations.push(op);
      continue;
    }

    const lowered = assetReference.toLowerCase();
    let byOwner = byLowercasedReference.get(lowered);
    if (!byOwner) {
      byOwner = new Map();
      byLowercasedReference.set(lowered, byOwner);
    }

    const owner = op.extra.assetOwner;
    const bucket = byOwner.get(owner);
    if (bucket) {
      bucket.push(op);
    } else {
      byOwner.set(owner, [op]);
    }
  }

  return { byLowercasedReference, nonStringReferenceOperations };
}

export async function buildSubAccounts({
  accountId,
  allTokenAssetsBalances,
  syncConfig,
  operations,
  getTokenFromAsset,
}: {
  accountId: string;
  allTokenAssetsBalances: Balance[];
  syncConfig: SyncConfig;
  operations: OperationCommon[];
  getTokenFromAsset?: (asset: AssetInfo) => Promise<TokenCurrency | undefined>;
}): Promise<TokenAccount[]> {
  const { blacklistedTokenIds = [] } = syncConfig;
  const tokenAccounts: TokenAccount[] = [];

  if (allTokenAssetsBalances.length === 0 || !getTokenFromAsset) {
    return tokenAccounts;
  }

  const tokenBalances = await Promise.all(
    allTokenAssetsBalances.map(async balance => ({
      balance,
      token: await getTokenFromAsset(balance.asset),
    })),
  );

  const { byLowercasedReference, nonStringReferenceOperations } =
    indexOperationsByAssetReference(operations);

  for (const { balance, token } of tokenBalances) {
    // NOTE: for future tokens, will need to check over currencyName/standard(erc20,trc10,trc20, etc)/id
    if (token && !blacklistedTokenIds.includes(token.id)) {
      const assetReference = balance.asset?.["assetReference"];
      const assetOwner = balance.asset?.["assetOwner"];
      // assetReference compared case-insensitively: a chain's own listOperations output and
      // its balance/getAssetFromToken derivation aren't guaranteed to agree on reference casing
      // (observed on Stacks -- one path lowercases a composite contract-address string, the
      // other returns it verbatim), so an exact-string match here would silently drop an
      // operation from its subAccount.
      const matchingOperations =
        typeof assetReference === "string"
          ? (byLowercasedReference.get(assetReference.toLowerCase())?.get(assetOwner) ?? [])
          : nonStringReferenceOperations.filter(
              op =>
                op.extra.assetReference === assetReference && op.extra.assetOwner === assetOwner,
            );

      tokenAccounts.push(
        buildTokenAccount({
          parentAccountId: accountId,
          assetBalance: balance,
          token,
          operations: matchingOperations,
        }),
      );
    }
  }

  return tokenAccounts;
}

/**
 * `maxOperations`, when set, bounds a sub-account's stored operations the same way the parent
 * account's history is bounded: `mergeOps` below only ever grows the merged list, so a token
 * still receiving transfers would otherwise accumulate operations forever across syncs -- on the
 * reference account the token operations are the bulk of the volume, dwarfing the parent's own.
 * `mergeOps` returns newest-first, so keeping the head keeps the newest. `undefined` is unbounded,
 * identical to today's behaviour.
 */
export function mergeSubAccounts(
  oldSubAccounts: Array<TokenAccount>,
  newSubAccounts: Array<TokenAccount>,
  maxOperations?: number,
): Array<TokenAccount> {
  if (!oldSubAccounts.length) {
    return newSubAccounts;
  }

  const oldSubAccountsByTokenId = Object.fromEntries(
    oldSubAccounts.map((account): [string, TokenAccount] => [String(account.token.id), account]),
  );

  const newSubAccountsToAdd: Array<TokenAccount> = [];

  for (const newSubAccount of newSubAccounts) {
    const existingSubAccount = oldSubAccountsByTokenId[String(newSubAccount.token.id)];

    if (!existingSubAccount) {
      // New sub account does not exist yet. Just add it as is.
      newSubAccountsToAdd.push(newSubAccount);
      continue;
    }

    // New sub account is already known, probably outdated
    const mergedOperations = mergeOps(existingSubAccount.operations, newSubAccount.operations);
    const operations =
      maxOperations === undefined ? mergedOperations : mergedOperations.slice(0, maxOperations);
    oldSubAccountsByTokenId[String(newSubAccount.token.id)] = {
      ...existingSubAccount,
      balance: newSubAccount.balance,
      spendableBalance: newSubAccount.spendableBalance,
      operations,
      operationsCount: operations.length,
    };
  }

  const updatedOldSubAccounts = Object.values(oldSubAccountsByTokenId);

  return [...updatedOldSubAccounts, ...newSubAccountsToAdd];
}
