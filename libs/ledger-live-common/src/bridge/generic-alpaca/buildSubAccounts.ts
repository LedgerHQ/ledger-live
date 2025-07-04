import BigNumber from "bignumber.js";
import { emptyHistoryCache } from "@ledgerhq/coin-framework/account/index";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { Operation, SyncConfig, TokenAccount } from "@ledgerhq/types-live";
import { parseCurrencyUnit } from "@ledgerhq/coin-framework/currencies/parseCurrencyUnit";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";

import { findTokenById, listTokensForCryptoCurrency } from "@ledgerhq/cryptoassets";
import { AssetInfo } from "@ledgerhq/coin-framework/lib/api/types";

// type BalanceAsset = {
//   balance: string;
//   limit: string;
//   buying_liabilities: string;
//   selling_liabilities: string;
//   last_modified_ledger: number;
//   is_authorized: boolean;
//   is_authorized_to_maintain_liabilities: boolean;
//   asset_type: string;
//   asset_code: string;
//   asset_issuer: string;
//   liquidity_pool_id?: string;
// };

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
  `${asset.assetReference}:${asset.assetOwner}`;

function buildStellarTokenAccount({
  parentAccountId,
  stellarAsset,
  token,
  operations,
}: {
  parentAccountId: string;
  stellarAsset: AssetInfo;
  token: TokenCurrency;
  operations: OperationCommon[];
}): TokenAccount {
  const assetId = getAssetIdFromTokenId(token.id);
  const id = `${parentAccountId}+${assetId}`;
  const balance = parseCurrencyUnit(token.units[0], stellarAsset?.balance || "0");

  const reservedBalance = new BigNumber(stellarAsset?.balance || "0").minus(
    stellarAsset.selling_liabilities || 0,
  );
  const spendableBalance = parseCurrencyUnit(token.units[0], reservedBalance.toString());

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
    spendableBalance,
    swapHistory: [],
    creationDate: operations.length > 0 ? operations[operations.length - 1].date : new Date(),
    balanceHistoryCache: emptyHistoryCache, // calculated in the jsHelpers
  };
}

export function buildSubAccounts({
  currency,
  accountId,
  assets,
  syncConfig,
  operations,
}: {
  currency: CryptoCurrency;
  accountId: string;
  assets: AssetInfo[];
  syncConfig: SyncConfig;
  operations: OperationCommon[];
}): TokenAccount[] | undefined {
  const { blacklistedTokenIds = [] } = syncConfig;
  const allTokens = listTokensForCryptoCurrency(currency);

  if (allTokens.length === 0 || assets.length === 0) {
    return undefined;
  }

  const tokenAccounts: TokenAccount[] = [];

  assets.map(asset => {
    const token = findTokenById(`stellar/asset/${getAssetIdFromAsset(asset)}`);

    if (token && !blacklistedTokenIds.includes(token.id)) {
      tokenAccounts.push(
        buildStellarTokenAccount({
          parentAccountId: accountId,
          stellarAsset: asset,
          token,
          operations: operations.filter(
            op =>
              op.asset?.assetReference === asset.assetReference &&
              op.asset?.assetOwner === asset.assetOwner,
          ),
        }),
      );
    }
  });

  return tokenAccounts;
}
