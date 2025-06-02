import { formatCurrencyUnit } from "@ledgerhq/coin-framework/lib-es/currencies/formatCurrencyUnit";
import counterValueFormatter from "@ledgerhq/live-common/market/utils/countervalueFormatter";
import { CounterValuesState } from "@ledgerhq/live-countervalues/types";
import { AssetType } from "@ledgerhq/react-ui/pre-ldls/index";
import { CryptoOrTokenCurrency, Currency } from "@ledgerhq/types-cryptoassets";
import { AccountLike } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { getBalanceAndFiatValue } from "LLD/utils/getBalanceAndFiatValue";

export const getBalanceAndFiatValueByAssets = (
  accounts: AccountLike[],
  assets: CryptoOrTokenCurrency[],
  state: CounterValuesState,
  toCurrency: Currency,
  discreet: boolean = false,
  locale: string,
): AssetType[] => {
  const groupedAccounts = groupAccountsByAsset(accounts);

  return assets.map(asset => {
    const accountsOfAsset = groupedAccounts.get(asset.id) || [];

    if (accountsOfAsset.length > 0) {
      if (discreet) {
        const { balance, fiatValue } = getBalanceAndFiatValue(
          accountsOfAsset[0],
          state,
          toCurrency,
          discreet,
        );
        return {
          id: asset.id,
          name: asset.name,
          ticker: asset.ticker,
          balance: balance,
          fiatValue: fiatValue,
        };
      }

      let totalBalance = new BigNumber(0);
      let totalFiatValue = new BigNumber(0);

      accountsOfAsset.forEach(account => {
        const { fiatValue } = getBalanceAndFiatValue(account, state, toCurrency, discreet, false);

        const balance = account.balance;

        const parsedFiatValue =
          typeof fiatValue === "string"
            ? parseFloat(fiatValue.replace(/,/g, ""))
            : Number(fiatValue);

        totalBalance = totalBalance.plus(balance);
        totalFiatValue = totalFiatValue.plus(BigNumber(parsedFiatValue));
      });

      const details =
        accountsOfAsset[0].type === "Account"
          ? accountsOfAsset[0].currency
          : accountsOfAsset[0].token;

      const formattedTotalBalance = formatCurrencyUnit(details.units[0], totalBalance, {
        showCode: true,
        discreet,
      });

      const formattedTotalFiatValue = counterValueFormatter({
        currency: toCurrency.ticker,
        value: totalFiatValue.toNumber(),
        locale,
      });

      return {
        id: asset.id,
        name: asset.name,
        ticker: asset.ticker,
        balance: formattedTotalBalance,
        fiatValue: formattedTotalFiatValue,
      };
    } else {
      const defaultFallbackEmptyBalance = "-";
      return {
        id: asset.id,
        name: asset.name,
        ticker: asset.ticker,
        balance: defaultFallbackEmptyBalance,
        fiatValue: defaultFallbackEmptyBalance,
      };
    }
  });
};

const groupAccountsByAsset = (accounts: AccountLike[]): Map<string, AccountLike[]> => {
  const groupedAccounts = new Map<string, AccountLike[]>();
  accounts.forEach(account => {
    const assetId = account.type === "Account" ? account.currency.id : account.token.id;
    if (!groupedAccounts.has(assetId)) {
      groupedAccounts.set(assetId, []);
    }
    groupedAccounts.get(assetId)?.push(account);
  });
  return groupedAccounts;
};
