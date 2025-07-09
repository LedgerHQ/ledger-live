import { accountNameWithDefaultSelector } from "@ledgerhq/live-wallet/store";
import { Account as AccountItem } from "@ledgerhq/react-ui/pre-ldls/components/AccountItem/AccountItem";
import { Account } from "@ledgerhq/types-live";
import { useCallback } from "react";
import { useSelector } from "react-redux";
import { formatAddress } from "LLD/utils/formatAddress";
import { counterValueCurrencySelector, discreetModeSelector } from "~/renderer/reducers/settings";
import { walletSelector } from "~/renderer/reducers/wallet";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { getBalanceAndFiatValue } from "LLD/utils/getBalanceAndFiatValue";
import { useCountervaluesState } from "@ledgerhq/live-countervalues-react";
import { getTagDerivationMode } from "@ledgerhq/coin-framework/derivation";

export const useFormatAccount = ({ currency }: { currency: CryptoCurrency }) => {
  const walletState = useSelector(walletSelector);
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const discreet = useSelector(discreetModeSelector);
  const state = useCountervaluesState();

  const formatAccount = useCallback(
    (account: Account): AccountItem => {
      const { fiatValue, balance } = getBalanceAndFiatValue(
        account,
        state,
        counterValueCurrency,
        discreet,
      );
      const protocol =
        account.type === "Account" &&
        account?.derivationMode !== undefined &&
        account?.derivationMode !== null &&
        currency.type === "CryptoCurrency" &&
        getTagDerivationMode(currency, account.derivationMode);

      return {
        address: formatAddress(account.freshAddress),
        cryptoId: account.currency.id,
        fiatValue: fiatValue || "",
        balance,
        protocol: protocol || "",
        id: account.id,
        name: accountNameWithDefaultSelector(walletState, account),
        ticker: account.currency.ticker,
      };
    },
    [counterValueCurrency, currency, discreet, state, walletState],
  );

  return formatAccount;
};
