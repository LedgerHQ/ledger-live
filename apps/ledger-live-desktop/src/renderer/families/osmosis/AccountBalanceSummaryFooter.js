// @flow

import React from "react";
import { useSelector } from "react-redux";
import { getAccountUnit } from "@ledgerhq/live-common/lib/account";
import { formatCurrencyUnit } from "@ledgerhq/live-common/lib/currencies";
import { localeSelector } from "~/renderer/reducers/settings";
import { useDiscreetMode } from "~/renderer/components/Discreet";
import { AccountBalanceSummaryFooterComponent } from "../cosmos/AccountBalanceSummaryFooter";

type Props = {
  account: any,
  countervalue: any,
};

const AccountBalanceSummaryFooter = ({ account, countervalue }: Props) => {
  const discreet = useDiscreetMode();
  const locale = useSelector(localeSelector);
  if (!account.cosmosResources) return null;

  const { spendableBalance: _spendableBalance, cosmosResources } = account;
  const {
    delegatedBalance: _delegatedBalance,
    unbondingBalance: _unbondingBalance,
  } = cosmosResources;
  const unit = getAccountUnit(account);
  const formatConfig = {
    disableRounding: true,
    alwaysShowSign: false,
    showCode: true,
    discreet,
    locale,
  };

  const spendableBalance = formatCurrencyUnit(unit, _spendableBalance, formatConfig);
  const delegatedBalance = formatCurrencyUnit(unit, _delegatedBalance, formatConfig);
  const unbondingBalance = formatCurrencyUnit(unit, _unbondingBalance, formatConfig);

  return (
    <AccountBalanceSummaryFooterComponent
      spendableBalance={spendableBalance}
      delegatedBalance={delegatedBalance}
      unbondingBalance={unbondingBalance}
      hasUnbondingBalance={_unbondingBalance.gt(0)}
    />
  );
};

export default AccountBalanceSummaryFooter;
