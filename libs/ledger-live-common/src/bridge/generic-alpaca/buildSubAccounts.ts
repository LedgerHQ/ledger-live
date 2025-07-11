import BigNumber from "bignumber.js";
import { emptyHistoryCache } from "@ledgerhq/coin-framework/account/index";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { Operation, SyncConfig, TokenAccount } from "@ledgerhq/types-live";
import { parseCurrencyUnit } from "@ledgerhq/coin-framework/currencies/parseCurrencyUnit";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";

import { findTokenById, listTokensForCryptoCurrency } from "@ledgerhq/cryptoassets";
import { AssetInfo, Balance } from "@ledgerhq/coin-framework/lib/api/types";

type BalanceAsset = {
  balance: string;
  limit: string;
  buying_liabilities: string;
  selling_liabilities: string;
  last_modified_ledger: number;
  is_authorized: boolean;
  is_authorized_to_maintain_liabilities: boolean;
  asset_type: string;
  asset_code: string;
  asset_issuer: string;
  liquidity_pool_id?: string;
};

// export type StellarOperation = Operation<StellarOperationExtra>;

// export type StellarOperationExtra = {
//   pagingToken?: string;
//   assetCode?: string;
//   assetIssuer?: string;
//   assetAmount?: string | undefined;
//   ledgerOpType: OperationType;
//   memo?: string;
//   blockTime: Date;
//   index: string;
// };

export interface OperationCommon extends Operation {
  extra: Record<string, any>;
}

export const getAssetIdFromTokenId = (tokenId: string): string => tokenId.split("/")[2];

export const getAssetIdFromAsset = (asset: AssetInfo) =>
  asset.type === "token" ? `${asset.assetReference}:${asset.assetOwner}` : "";

function buildStellarTokenAccount({
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
  const assetId = getAssetIdFromTokenId(token.id);
  const id = `${parentAccountId}+${assetId}`;
  const balance = new BigNumber(assetBalance.value.toString() || "0");

  // TODO: recheck this logic
  const reservedBalance = new BigNumber(assetBalance.value.toString()).minus(
    // assetBalance.selling_liabilities || 0,
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
    spendableBalance: reservedBalance,
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
}: {
  currency: CryptoCurrency;
  accountId: string;
  assetsBalance: Balance[];
  syncConfig: SyncConfig;
  operations: OperationCommon[];
}): TokenAccount[] | undefined {
  const { blacklistedTokenIds = [] } = syncConfig;
  const allTokens = listTokensForCryptoCurrency(currency);

  if (allTokens.length === 0 || assetsBalance.length === 0) {
    return undefined;
  }

  const tokenAccounts: TokenAccount[] = [];
  // console.log("assetsBalance", assetsBalance);
  assetsBalance
    .filter(b => b.asset.type === "token") // NOTE: this could be removed, keeping here while fixing things up
    .map(balance => {
      const token = findTokenById(`stellar/asset/${getAssetIdFromAsset(balance.asset)}`);
      console.log("token", token);
      if (token && !blacklistedTokenIds.includes(token.id)) {
        tokenAccounts.push(
          buildStellarTokenAccount({
            parentAccountId: accountId,
            assetBalance: balance,
            token,
            operations: operations.filter(
              op =>
                op.extra.assetCode === balance.asset["assetReference"] &&
                op.extra.assetIssuer === balance.asset["assetOwner"], // NOTE: we could narrow type
            ),
          }),
        );
      }
    });
    console.log("tokenAccounts", tokenAccounts);

  return tokenAccounts;
}
