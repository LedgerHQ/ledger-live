import React from "react";
import type { BigNumber } from "bignumber.js";
import { useTranslation } from "react-i18next";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import type { CardanoAccount } from "@ledgerhq/live-common/families/cardano/types";
import type { TokenAccount } from "@ledgerhq/types-live";
import {
  AccountBalanceSummary,
  type BalanceItem,
} from "@features/flow-account-detail-balance-summary";
import { useSelector } from "LLD/hooks/redux";
import { useDiscreetMode } from "~/renderer/components/Discreet";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";
import { localeSelector } from "~/renderer/reducers/settings";

const CardanoBalances = ({ account }: { account: CardanoAccount }) => {
  const { t } = useTranslation();
  const discreet = useDiscreetMode();
  const locale = useSelector(localeSelector);
  const unit = useAccountUnit(account);

  const format = (amount: BigNumber) =>
    formatCurrencyUnit(unit, amount, {
      disableRounding: true,
      alwaysShowSign: false,
      showCode: true,
      locale,
    });
  const delegation = account.cardanoResources.delegation;

  const items: readonly BalanceItem[] = [
    {
      id: "available",
      label: t("account.availableBalance"),
      description: t("account.availableBalanceTooltip"),
      value: format(account.spendableBalance),
    },
    ...(delegation?.poolId
      ? [
          { id: "delegated", label: t("account.delegatedAssets"), value: format(account.balance) },
          { id: "rewards", label: t("delegation.rewards"), value: format(delegation.rewards) },
        ]
      : []),
  ];

  return (
    <AccountBalanceSummary
      items={items}
      discreet={discreet}
      testID="account-detail-cardano-balance-summary"
    />
  );
};

const AccountDetailBalanceSummary = ({ account }: { account: CardanoAccount | TokenAccount }) =>
  account.type === "Account" ? <CardanoBalances account={account} /> : null;

export default AccountDetailBalanceSummary;
