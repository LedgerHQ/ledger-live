import BigNumber from "bignumber.js";
import { emptyHistoryCache, encodeTokenAccountId } from "@ledgerhq/coin-framework/account/index";
import type { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { SyncConfig, TokenAccount } from "@ledgerhq/types-live";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import { AssetInfo, Balance } from "@ledgerhq/coin-framework/api/types";
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

  for (const balance of allTokenAssetsBalances) {
    const token = await getTokenFromAsset(balance.asset);
    // NOTE: for future tokens, will need to check over currencyName/standard(erc20,trc10,trc20, etc)/id
    if (token && !blacklistedTokenIds.includes(token.id)) {
      tokenAccounts.push(
        buildTokenAccount({
          parentAccountId: accountId,
          assetBalance: balance,
          token,
          operations: operations.filter(
            op =>
              op.extra.assetReference === balance.asset?.["assetReference"] &&
              op.extra.assetOwner === balance.asset?.["assetOwner"], // NOTE: we could narrow type
          ),
        }),
      );
    }
  }

  return tokenAccounts;
}

export function mergeSubAccounts(
  oldSubAccounts: Array<TokenAccount>,
  newSubAccounts: Array<TokenAccount>,
): Array<TokenAccount> {
  if (!oldSubAccounts.length) {
    return newSubAccounts;
  }

  const oldSubAccountsByTokenId = Object.fromEntries(
    oldSubAccounts.map(account => [account.token.id, account]),
  );

  const newSubAccountsToAdd: Array<TokenAccount> = [];

  for (const newSubAccount of newSubAccounts) {
    const existingSubAccount = oldSubAccountsByTokenId[newSubAccount.token.id];

    if (!existingSubAccount) {
      // New sub account does not exist yet. Just add it as is.
      newSubAccountsToAdd.push(newSubAccount);
      continue;
    }

    // New sub account is already known, probably outdated
    const operations = mergeOps(existingSubAccount.operations, newSubAccount.operations);
    oldSubAccountsByTokenId[newSubAccount.token.id] = {
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
