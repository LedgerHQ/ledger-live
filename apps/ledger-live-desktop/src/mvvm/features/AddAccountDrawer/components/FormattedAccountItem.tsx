import React, { useMemo } from "react";
import { formatCurrencyUnit } from "@ledgerhq/coin-module-framework/currencies/formatCurrencyUnit";
import BigNumber from "bignumber.js";
import { FormattedAccount } from "../screens/AccountsAdded/types";
import { AccountRow, type AccountRowTrailing } from "./AccountRow";

type FormattedAccountItemProps = {
  account: FormattedAccount;
  onClick?: () => void;
  trailing?: AccountRowTrailing;
  checked?: boolean;
  onEdit?: () => void;
};

export const FormattedAccountItem = ({
  account,
  onClick,
  trailing,
  checked,
  onEdit,
}: FormattedAccountItemProps) => {
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

  return (
    <AccountRow
      account={{
        ...account,
        balance: formattedBalance,
        fiatValue: formattedFiatValue,
      }}
      checked={checked}
      onClick={onClick}
      onEdit={onEdit}
      trailing={trailing}
    />
  );
};
