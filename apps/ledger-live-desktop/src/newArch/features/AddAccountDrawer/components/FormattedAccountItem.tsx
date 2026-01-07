import React, { useMemo } from "react";
import { AccountItem } from "@ledgerhq/react-ui/pre-ldls/index";
import {
  Account as UIAccount,
  RightElement,
} from "@ledgerhq/react-ui/pre-ldls/components/AccountItem/AccountItem";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies/formatCurrencyUnit";
import BigNumber from "bignumber.js";
import { FormattedAccount } from "../screens/AccountsAdded/types";

interface FormattedAccountItemProps {
  account: FormattedAccount;
  backgroundColor?: string;
  rightElement?: RightElement;
  onClick?: () => void;
}

// Adapter component that formats raw values for UI consumption
// NB: in future, it should  be on react-ui side to do the <FormattedVal />
export const FormattedAccountItem: React.FC<FormattedAccountItemProps> = ({
  account,
  backgroundColor,
  onClick,
  rightElement,
}) => {
  const formattedBalance = useMemo(() => {
    return formatCurrencyUnit(account.balanceUnit, account.balance, {
      showCode: true,
      discreet: account.discreet,
      locale: account.locale,
    });
  }, [account.balance, account.balanceUnit, account.discreet, account.locale]);

  const formattedFiatValue = useMemo(() => {
    if (account.fiatValue !== undefined && account.fiatUnit) {
      return formatCurrencyUnit(account.fiatUnit, new BigNumber(account.fiatValue), {
        showCode: true,
        discreet: account.discreet,
        locale: account.locale,
      });
    }
    return "";
  }, [account.fiatValue, account.fiatUnit, account.discreet, account.locale]);

  const uiAccount: UIAccount = useMemo(
    () => ({
      ...account,
      balance: formattedBalance,
      fiatValue: formattedFiatValue,
    }),
    [account, formattedBalance, formattedFiatValue],
  );

  return (
    <AccountItem
      account={uiAccount}
      backgroundColor={backgroundColor}
      onClick={onClick}
      rightElement={rightElement}
    />
  );
};
