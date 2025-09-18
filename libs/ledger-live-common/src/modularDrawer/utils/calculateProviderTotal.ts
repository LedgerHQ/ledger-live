import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import BigNumber from "bignumber.js";
import { GroupedAccount } from "./groupAccountsByAsset";

export const calculateProviderTotals = (
  currencies: CryptoOrTokenCurrency[],
  groupedAccountsByAsset: Record<string, GroupedAccount>,
) => {
  let totalBalance = new BigNumber(0);
  let totalFiatValue = new BigNumber(0);
  let hasAccounts = false;

  for (const currency of currencies) {
    const assetGroup = groupedAccountsByAsset[currency.id];
    if (assetGroup?.accounts.length > 0) {
      totalBalance = totalBalance.plus(assetGroup.totalBalance);
      totalFiatValue = totalFiatValue.plus(assetGroup.totalFiatValue);
      hasAccounts = true;
    }
  }

  return { totalBalance, totalFiatValue, hasAccounts };
};
