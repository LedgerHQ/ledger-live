import BigNumber from "bignumber.js";
import { emptyHistoryCache } from "../../account";
import {
  listTokensForCryptoCurrency,
  findTokenById,
  parseCurrencyUnit,
} from "../../currencies";
import type {
  TokenAccount,
  TokenCurrency,
  Operation,
  CryptoCurrency,
  SyncConfig,
} from "../../types";
import type { BalanceAsset } from "./types";

const getAssetIdFromTokenId = (tokenId: string) => tokenId.split("/")[2];

const getAssetIdFromAsset = (asset: BalanceAsset) =>
  `${asset.asset_code}:${asset.asset_issuer}`;

const buildStellarTokenAccount = ({
  parentAccountId,
  stellarAsset,
  token,
}: {
  parentAccountId: string;
  stellarAsset: BalanceAsset;
  token: TokenCurrency;
}): TokenAccount => {
  const assetId = getAssetIdFromTokenId(token.id);
  const id = `${parentAccountId}+${assetId}`;
  const balance = parseCurrencyUnit(
    token.units[0],
    stellarAsset.balance || "0"
  );

  const reservedBalance = new BigNumber(stellarAsset.balance).minus(
    stellarAsset.buying_liabilities || 0
  );
  const spendableBalance = parseCurrencyUnit(
    token.units[0],
    reservedBalance.toString()
  );
  // TODO: get all operations
  const operations: Operation[] = [];

  return {
    type: "TokenAccount",
    id,
    parentId: parentAccountId,
    starred: false,
    token,
    operationsCount: operations.length,
    operations,
    pendingOperations: [],
    balance,
    spendableBalance,
    swapHistory: [],
    creationDate:
      operations.length > 0
        ? operations[operations.length - 1].date
        : new Date(),
    balanceHistoryCache: emptyHistoryCache, // calculated in the jsHelpers
  };
};

export const buildSubAccounts = ({
  currency,
  accountId,
  assets,
  syncConfig,
}: {
  currency: CryptoCurrency;
  accountId: string;
  assets: BalanceAsset[];
  syncConfig: SyncConfig;
}): TokenAccount[] | undefined => {
  const { blacklistedTokenIds = [] } = syncConfig;
  const allTokens = listTokensForCryptoCurrency(currency);

  if (allTokens.length === 0 || assets.length === 0) {
    return undefined;
  }

  const tokenAccounts: TokenAccount[] = [];

  assets.forEach((asset) => {
    const token = findTokenById(`stellar/asset/${getAssetIdFromAsset(asset)}`);

    if (token && !blacklistedTokenIds.includes(token.id)) {
      tokenAccounts.push(
        buildStellarTokenAccount({
          parentAccountId: accountId,
          stellarAsset: asset,
          token,
        })
      );
    }
  });

  return tokenAccounts;
};
