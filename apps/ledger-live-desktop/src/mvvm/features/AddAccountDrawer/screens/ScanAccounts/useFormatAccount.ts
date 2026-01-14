import { getTagDerivationMode } from "@ledgerhq/coin-framework/derivation";
import { accountNameWithDefaultSelector } from "@ledgerhq/live-wallet/store";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { Account } from "@ledgerhq/types-live";
import { useCallback } from "react";
import { useSelector } from "LLD/hooks/redux";
import { discreetModeSelector, localeSelector } from "~/renderer/reducers/settings";
import { walletSelector } from "~/renderer/reducers/wallet";
import { FormattedAccount } from "../AccountsAdded/types";

export const useFormatAccount = (currency: CryptoCurrency) => {
  const walletState = useSelector(walletSelector);
  const discreet = useSelector(discreetModeSelector);
  const locale = useSelector(localeSelector);

  return useCallback(
    (account: Account): FormattedAccount => {
      return {
        address: account.freshAddress,
        balance: account.balance,
        balanceUnit: account.currency.units[0],
        cryptoId: account.currency.id,
        // Formatting parameters
        locale,
        discreet,
        // Other properties
        id: account.id,
        name: accountNameWithDefaultSelector(walletState, account),
        protocol: getTagDerivationMode(currency, account.derivationMode) ?? "",
        ticker: account.currency.ticker,
      };
    },
    [currency, discreet, walletState, locale],
  );
};
