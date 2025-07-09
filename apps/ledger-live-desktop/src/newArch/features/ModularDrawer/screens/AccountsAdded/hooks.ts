import { useCallback } from "react";
import { useSelector } from "react-redux";
import { useCountervaluesState } from "@ledgerhq/live-countervalues-react";
import { accountNameWithDefaultSelector } from "@ledgerhq/live-wallet/store";
import { Account } from "@ledgerhq/types-live";
import { walletSelector } from "~/renderer/reducers/wallet";
import { counterValueCurrencySelector, discreetModeSelector } from "~/renderer/reducers/settings";
import { formatAddress } from "LLD/utils/formatAddress";
import { getBalanceAndFiatValue } from "LLD/utils/getBalanceAndFiatValue";
import { FormattedAccount } from "./types";
import { getAccountProtocol } from "../../utils/getAccountProtocol";

export const useAccountsData = () => {
  const walletState = useSelector(walletSelector);
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const countervaluesState = useCountervaluesState();
  const discreet = useSelector(discreetModeSelector);

  return {
    walletState,
    counterValueCurrency,
    countervaluesState,
    discreet,
  };
};

export const useAccountFormatter = () => {
  const { walletState, counterValueCurrency, countervaluesState, discreet } = useAccountsData();

  return useCallback(
    (account: Account): FormattedAccount => {
      const { fiatValue, balance } = getBalanceAndFiatValue(
        account,
        countervaluesState,
        counterValueCurrency,
        discreet,
      );

      const protocol = getAccountProtocol(account);
      const accountName = accountNameWithDefaultSelector(walletState, account);

      return {
        address: formatAddress(account.freshAddress),
        cryptoId: account.currency.id,
        fiatValue,
        balance,
        protocol: protocol || "",
        id: account.id,
        name: accountName,
        ticker: account.currency.ticker,
      };
    },
    [counterValueCurrency, discreet, countervaluesState, walletState],
  );
};
