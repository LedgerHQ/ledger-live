// @flow

import React from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
  const discreet = useDiscreetMode();
  const locale = useSelector(localeSelector);
  if (!account.cosmosResources) return null;

  const { spendableBalance: _spendableBalance, cosmosResources } = account;
  console.log("account is: ", account);
  console.log("spendableBalance  is: ", _spendableBalance);

  const {
    delegatedBalance: _delegatedBalance,
    unbondingBalance: _unbondingBalance,
  } = cosmosResources;

  console.log("_delegatedBalance  is: ", _delegatedBalance);
  console.log("_unbondingBalance  is: ", _unbondingBalance);

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
      localizations={{
        availableBalanceTooltip: t("account.availableBalanceTooltip"),
        availableBalance: t("account.availableBalance"),
        delegatedAssetsTooltip: t("account.delegatedTooltip"),
        delegatedAssets: t("account.delegatedAssets"),
        undelegatedAssetsTooltip: t("account.undelegatingTooltip", { timelockInDays: 14 }),
        undelegatedAssets: t("account.undelegating"),
      }}
    />
  );
};

export default AccountBalanceSummaryFooter;
