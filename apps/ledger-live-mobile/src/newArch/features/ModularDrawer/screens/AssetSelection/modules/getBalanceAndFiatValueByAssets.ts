import { formatCurrencyUnit } from "@ledgerhq/coin-framework/lib-es/currencies/formatCurrencyUnit";
import type { CounterValuesState } from "@ledgerhq/live-countervalues/types";
import type { AssetType } from "@ledgerhq/native-ui/pre-ldls/index";
import type { CryptoOrTokenCurrency, Currency } from "@ledgerhq/types-cryptoassets";
import type { AccountLike } from "@ledgerhq/types-live";
import { groupAccountsByAsset, type GroupedAccount } from "./groupAccountsByAsset";
import { counterValueFormatter } from "@ledgerhq/live-common/market/utils/countervalueFormatter";

interface ExtendedAssetType extends AssetType {
  balance?: string;
  fiatValue?: string;
}

export const getBalanceAndFiatValueByAssets = (
  accounts: AccountLike[],
  assets: CryptoOrTokenCurrency[],
  counterValuesState: CounterValuesState,
  targetCurrency: Currency,
  isDiscreetMode: boolean = false,
  userLocale: string,
): ExtendedAssetType[] => {
  const groupedAccountsByAsset = groupAccountsByAsset(
    accounts,
    counterValuesState,
    targetCurrency,
    isDiscreetMode,
  );

  return assets.map(asset => {
    const assetGroup = groupedAccountsByAsset[asset.id];

    if (assetGroup) {
      return formatAssetDetails(assetGroup, asset, targetCurrency, isDiscreetMode, userLocale);
    }

    return {
      id: asset.id,
      name: asset.name,
      ticker: asset.ticker,
    };
  });
};

const formatAssetDetails = (
  assetGroup: GroupedAccount,
  asset: CryptoOrTokenCurrency,
  targetCurrency: Currency,
  isDiscreetMode: boolean,
  userLocale: string,
): ExtendedAssetType => {
  const assetDetails =
    assetGroup.accounts[0].type === "Account"
      ? assetGroup.accounts[0].currency
      : assetGroup.accounts[0].token;

  const formattedBalance = formatCurrencyUnit(assetDetails.units[0], assetGroup.totalBalance, {
    showCode: true,
    discreet: isDiscreetMode,
  });

  const formattedFiatValue = counterValueFormatter({
    currency: targetCurrency.ticker,
    value: assetGroup.totalFiatValue.toNumber(),
    locale: userLocale,
  });

  return {
    id: asset.id,
    name: asset.name,
    ticker: asset.ticker,
    balance: formattedBalance,
    fiatValue: formattedFiatValue,
  };
};
