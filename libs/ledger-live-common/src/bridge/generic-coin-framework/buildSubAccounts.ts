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
  id,
  parentAccountId,
  assetBalance,
  token,
  operations,
}: {
  id: string;
  parentAccountId: string;
  assetBalance: Balance;
  token: TokenCurrency;
  operations: OperationCommon[];
}): TokenAccount {
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
    creationDate: operations.length > 0 ? operations[operations.length - 1].date : new Date(),
    balanceHistoryCache: emptyHistoryCache, // calculated in the jsHelpers
  };
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

  for (const { balance, token } of tokenBalances) {
    // NOTE: for future tokens, will need to check over currencyName/standard(erc20,trc10,trc20, etc)/id
    if (token && !blacklistedTokenIds.includes(token.id)) {
      tokenAccounts.push({
        ...buildTokenAccount({
          id: encodeTokenAccountId(accountId, token),
          parentAccountId: accountId,
          assetBalance: balance,
          token,
          // assetReference compared case-insensitively: a chain's own listOperations output and
          // its balance/getAssetFromToken derivation aren't guaranteed to agree on reference casing
          // (observed on Stacks -- one path lowercases a composite contract-address string, the
          // other returns it verbatim), so an exact-string match here would silently drop an
          // operation from its subAccount.
          operations: operations.filter(op => {
            const assetReference = balance.asset?.["assetReference"];
            return (
              (typeof op.extra.assetReference === "string" && typeof assetReference === "string"
                ? op.extra.assetReference.toLowerCase() === assetReference.toLowerCase()
                : op.extra.assetReference === assetReference) &&
              op.extra.assetOwner === balance.asset?.["assetOwner"] // NOTE: we could narrow type
            );
          }),
        }),
      });
    }
  }

  return tokenAccounts;
}

/** Keeps only what the chain still reports, carrying the stored operations of a token that stays. */
export function mergeSubAccounts(
  oldSubAccounts: Array<TokenAccount>,
  newSubAccounts: Array<TokenAccount>,
): Array<TokenAccount> {
  if (!oldSubAccounts.length) {
    return newSubAccounts;
  }

  const oldSubAccountsByTokenId = Object.fromEntries(
    oldSubAccounts.map((account): [string, TokenAccount] => [String(account.token.id), account]),
  );

  return newSubAccounts.map(newSubAccount => {
    const existingSubAccount = oldSubAccountsByTokenId[String(newSubAccount.token.id)];
    if (!existingSubAccount) return newSubAccount;

    const operations = mergeOps(existingSubAccount.operations, newSubAccount.operations);
    return {
      ...newSubAccount,
      operations,
      operationsCount: operations.length,
      pendingOperations: existingSubAccount.pendingOperations,
      swapHistory: existingSubAccount.swapHistory,
      balanceHistoryCache: existingSubAccount.balanceHistoryCache,
      creationDate: existingSubAccount.creationDate,
    };
  });
}
