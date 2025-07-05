import BigNumber from "bignumber.js";
import { emptyHistoryCache } from "@ledgerhq/coin-framework/account/index";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { SyncConfig, TokenAccount } from "@ledgerhq/types-live";
import { parseCurrencyUnit } from "@ledgerhq/coin-framework/currencies/parseCurrencyUnit";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import { findTokenById, listTokensForCryptoCurrency } from "@ledgerhq/cryptoassets";
import { BalanceAsset, StellarOperation } from "../types";

export const getAssetIdFromTokenId = (tokenId: string): string => tokenId.split("/")[2];

export const getAssetIdFromAsset = (asset: BalanceAsset) =>
  `${asset.asset_code}:${asset.asset_issuer}`;

function buildStellarTokenAccount({
  parentAccountId,
  balance,
  sellingLiabilities,
  token,
  operations,
}: {
  parentAccountId: string;
  balance: string;
  sellingLiabilities: string;
  token: TokenCurrency;
  operations: StellarOperation[];
}): TokenAccount {
  const assetId = getAssetIdFromTokenId(token.id);
  const id = `${parentAccountId}+${assetId}`;

  const parsedBalance = parseCurrencyUnit(token.units[0], balance);
  const reservedBalance = new BigNumber(balance).minus(sellingLiabilities || 0);
  const spendableBalance = parseCurrencyUnit(token.units[0], reservedBalance.toString());

  return {
    type: "TokenAccount",
    id,
    parentId: parentAccountId,
    token,
    operationsCount: operations.length,
    operations: operations.map(op => ({
      ...op,
      id: encodeOperationId(id, op.hash, op.extra.ledgerOpType),
      accountId: id,
      type: op.extra.ledgerOpType,
      value: op.extra.assetAmount ? new BigNumber(op.extra.assetAmount) : op.value,
    })),
    pendingOperations: [],
    balance: parsedBalance,
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
  assets: BalanceAsset[];
  syncConfig: SyncConfig;
  operations: StellarOperation[];
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
          balance: asset.balance || "0",
          sellingLiabilities: asset.selling_liabilities || "0",
          token,
          operations: operations.filter(
            op =>
              op.extra.assetCode === asset.asset_code &&
              op.extra.assetIssuer === asset.asset_issuer,
          ),
        }),
      );
    }
  });

  return tokenAccounts;
}
