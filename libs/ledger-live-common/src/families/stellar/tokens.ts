import BigNumber from "bignumber.js";
import { emptyHistoryCache } from "../../account";
import {
  listTokensForCryptoCurrency,
  findTokenById,
  parseCurrencyUnit,
} from "../../currencies";
import type { BalanceAsset } from "./types";
import { encodeOperationId } from "../../operation";
import type {
  CryptoCurrency,
  TokenCurrency,
} from "@ledgerhq/types-cryptoassets";
import type { Operation, SyncConfig, TokenAccount } from "@ledgerhq/types-live";

export const getAssetIdFromTokenId = (tokenId: string): string =>
  tokenId.split("/")[2];

const getAssetIdFromAsset = (asset: BalanceAsset) =>
  `${asset.asset_code}:${asset.asset_issuer}`;

const buildStellarTokenAccount = ({
  parentAccountId,
  stellarAsset,
  token,
  operations,
}: {
  parentAccountId: string;
  stellarAsset: BalanceAsset;
  token: TokenCurrency;
  operations: Operation[];
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

  return {
    type: "TokenAccount",
    id,
    parentId: parentAccountId,
    starred: false,
    token,
    operationsCount: operations.length,
    operations: operations.map((op) => ({
      ...op,
      id: encodeOperationId(id, op.hash, op.extra.ledgerOpType),
      accountId: id,
      type: op.extra.ledgerOpType,
      value: new BigNumber(op.extra.assetAmount) ?? op.value,
    })),
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
  operations,
}: {
  currency: CryptoCurrency;
  accountId: string;
  assets: BalanceAsset[];
  syncConfig: SyncConfig;
  operations: Operation[];
}): TokenAccount[] | undefined => {
  const { blacklistedTokenIds = [] } = syncConfig;
  const allTokens = listTokensForCryptoCurrency(currency);

  if (allTokens.length === 0 || assets.length === 0) {
    return undefined;
  }

  const tokenAccounts: TokenAccount[] = [];

  assets.map((asset) => {
    const token = findTokenById(`stellar/asset/${getAssetIdFromAsset(asset)}`);

    if (token && !blacklistedTokenIds.includes(token.id)) {
      tokenAccounts.push(
        buildStellarTokenAccount({
          parentAccountId: accountId,
          stellarAsset: asset,
          token,
          operations: operations.filter(
            (op) =>
              op.extra.assetCode === asset.asset_code &&
              op.extra.assetIssuer === asset.asset_issuer
          ),
        })
      );
    }
  });

  return tokenAccounts;
};
