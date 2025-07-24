import { getTagDerivationMode } from "@ledgerhq/coin-framework/derivation";
import { useCountervaluesState } from "@ledgerhq/live-countervalues-react";
import { accountNameWithDefaultSelector } from "@ledgerhq/live-wallet/store";
import { Account as FormattedAccount } from "@ledgerhq/react-ui/pre-ldls/components/AccountItem/AccountItem";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { Account } from "@ledgerhq/types-live";
import { formatAddress } from "LLD/utils/formatAddress";
import { getBalanceAndFiatValue } from "LLD/utils/getBalanceAndFiatValue";
import { useCallback } from "react";
import { useSelector } from "react-redux";
import { counterValueCurrencySelector, discreetModeSelector } from "~/renderer/reducers/settings";
import { walletSelector } from "~/renderer/reducers/wallet";

export const useFormatAccount = (currency: CryptoCurrency) => {
  const walletState = useSelector(walletSelector);
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const discreet = useSelector(discreetModeSelector);
  const counterValueState = useCountervaluesState();

  return useCallback(
    (account: Account): FormattedAccount => {
      const { fiatValue, balance } = getBalanceAndFiatValue(
        account,
        counterValueState,
        counterValueCurrency,
        discreet,
      );

      return {
        address: formatAddress(account.freshAddress),
        balance,
        cryptoId: account.currency.id,
        fiatValue: fiatValue ?? "",
        id: account.id,
        name: accountNameWithDefaultSelector(walletState, account),
        protocol: getTagDerivationMode(currency, account.derivationMode) ?? "",
        ticker: account.currency.ticker,
      };
    },
    [counterValueCurrency, counterValueState, currency, discreet, walletState],
  );
};
