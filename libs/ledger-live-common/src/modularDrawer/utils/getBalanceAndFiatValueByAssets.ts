import type { CryptoOrTokenCurrency, Currency } from "@ledgerhq/types-cryptoassets";
import { groupAccountsByAsset, type GroupedAccount } from "./groupAccountsByAsset";
import { AssetType } from "./type";
import { AccountLike } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import type { CounterValuesState } from "@ledgerhq/live-countervalues/types";

interface ExtendedAssetType extends AssetType {
  currency?: CryptoOrTokenCurrency;
  balance?: BigNumber;
  fiatValue?: number;
}

export const getBalanceAndFiatValueByAssets = (
  accounts: AccountLike[],
  assets: CryptoOrTokenCurrency[],
  counterValuesState: CounterValuesState,
  targetCurrency: Currency,
): ExtendedAssetType[] => {
  const groupedAccountsByAsset = groupAccountsByAsset(accounts, counterValuesState, targetCurrency);

  return assets.map(asset => {
    const assetGroup = groupedAccountsByAsset[asset.id];

    if (assetGroup) {
      return yieldAssetDetails(assetGroup, asset);
    }

    return {
      id: asset.id,
      name: asset.name,
      ticker: asset.ticker,
    };
  });
};

const yieldAssetDetails = (
  assetGroup: GroupedAccount,
  asset: CryptoOrTokenCurrency,
): ExtendedAssetType => {
  const assetDetails =
    assetGroup.accounts[0].type === "Account"
      ? assetGroup.accounts[0].currency
      : assetGroup.accounts[0].token;

  return {
    id: asset.id,
    name: asset.name,
    ticker: asset.ticker,
    currency: assetDetails,
    balance: assetGroup.totalBalance,
    fiatValue: assetGroup.totalFiatValue.toNumber(),
  };
};
