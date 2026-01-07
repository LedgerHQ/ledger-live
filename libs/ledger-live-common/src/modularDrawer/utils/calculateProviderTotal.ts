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
  let referenceCurrency: CryptoOrTokenCurrency | null = null;

  for (const currency of currencies) {
    const assetGroup = groupedAccountsByAsset[currency.id];
    if (assetGroup?.accounts.length > 0) {
      const refCurrency = referenceCurrency ?? assetGroup.referenceCurrency;
      const magnitudeDiff =
        refCurrency.units[0].magnitude - assetGroup.referenceCurrency.units[0].magnitude;
      const normalizedBalance = assetGroup.totalBalance.shiftedBy(magnitudeDiff);

      totalBalance = totalBalance.plus(normalizedBalance);
      totalFiatValue = totalFiatValue.plus(assetGroup.totalFiatValue);
      hasAccounts = true;

      // Use the referenceCurrency from the first asset group with accounts
      if (!referenceCurrency) {
        referenceCurrency = assetGroup.referenceCurrency;
      }
    }
  }

  return { totalBalance, totalFiatValue, hasAccounts, referenceCurrency };
};
