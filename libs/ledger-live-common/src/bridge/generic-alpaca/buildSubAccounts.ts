import BigNumber from "bignumber.js";
import { emptyHistoryCache, encodeTokenAccountId } from "@ledgerhq/coin-framework/account/index";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { Operation, SyncConfig, TokenAccount } from "@ledgerhq/types-live";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import { listTokensForCryptoCurrency } from "@ledgerhq/cryptoassets";
import { AssetInfo, Balance } from "@ledgerhq/coin-framework/api/types";

export interface OperationCommon extends Operation {
  extra: Record<string, any>;
}

export const getAssetIdFromTokenId = (tokenId: string): string => tokenId.split("/")[2];

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

  const tokenOperations = operations.map(op => ({
    ...op,
    id: encodeOperationId(id, op.hash, op.extra?.ledgerOpType),
    accountId: id,
    type: op.extra?.ledgerOpType,
    value: op.extra?.assetAmount ? new BigNumber(op.extra?.assetAmount) : op.value,
  }));

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

export function buildSubAccounts({
  currency,
  accountId,
  assetsBalance,
  syncConfig,
  operations,
  getTokenFromAsset,
}: {
  currency: CryptoCurrency;
  accountId: string;
  assetsBalance: Balance[];
  syncConfig: SyncConfig;
  operations: OperationCommon[];
  getTokenFromAsset?: (asset: AssetInfo) => TokenCurrency | undefined;
}): TokenAccount[] | undefined {
  const { blacklistedTokenIds = [] } = syncConfig;
  const allTokens = listTokensForCryptoCurrency(currency);

  if (allTokens.length === 0 || assetsBalance.length === 0) {
    return undefined;
  }
  const tokenAccounts: TokenAccount[] = [];
  assetsBalance
    .filter(b => b.asset.type !== "native") // NOTE: this could be removed, keeping here while fixing things up
    .map(balance => {
      const token = getTokenFromAsset && getTokenFromAsset(balance.asset);
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
    });
  return tokenAccounts;
}
