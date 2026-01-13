import { accountNameWithDefaultSelector } from "@ledgerhq/live-wallet/store";
import { Account } from "@ledgerhq/types-live";
import { useCallback } from "react";
import { useSelector } from "LLD/hooks/redux";
import { discreetModeSelector, localeSelector } from "~/renderer/reducers/settings";
import { walletSelector } from "~/renderer/reducers/wallet";
import { getAccountProtocol } from "./getAccountProtocol";
import { FormattedAccount } from "./types";

export const useAccountsData = () => {
  const walletState = useSelector(walletSelector);
  const discreet = useSelector(discreetModeSelector);

  return {
    walletState,
    discreet,
  };
};

export const useAccountFormatter = () => {
  const { walletState, discreet } = useAccountsData();
  const locale = useSelector(localeSelector);

  return useCallback(
    (account: Account): FormattedAccount => {
      const protocol = getAccountProtocol(account);
      const accountName = accountNameWithDefaultSelector(walletState, account);

      return {
        address: account.freshAddress,
        cryptoId: account.currency.id,
        // Raw values for UI formatting
        balance: account.balance,
        balanceUnit: account.currency.units[0],
        // Formatting parameters
        locale,
        discreet,
        // Other properties
        protocol: protocol || "",
        id: account.id,
        name: accountName,
        ticker: account.currency.ticker,
      };
    },
    [discreet, walletState, locale],
  );
};
