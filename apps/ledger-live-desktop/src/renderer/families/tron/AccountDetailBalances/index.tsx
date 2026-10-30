import React from "react";
import { BigNumber } from "bignumber.js";
import { useTranslation } from "react-i18next";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import type { TronAccount } from "@ledgerhq/live-common/families/tron/types";
import type { TokenAccount } from "@ledgerhq/types-live";
import { AccountBalances, type BalanceItem } from "@features/flow-account-detail-balances";
import { useSelector } from "LLD/hooks/redux";
import { useDiscreetMode } from "~/renderer/components/Discreet";
import { useMaybeAccountUnit } from "~/renderer/hooks/useAccountUnit";
import { localeSelector } from "~/renderer/reducers/settings";

const EMPTY_FIGURE = "–";

const sumAmounts = (entries: readonly { amount: BigNumber }[] | null | undefined) =>
  (entries ?? []).reduce((total, { amount }) => total.plus(amount), new BigNumber(0));

const TronBalances = ({ account }: { account: TronAccount }) => {
  const { t } = useTranslation();
  const discreet = useDiscreetMode();
  const locale = useSelector(localeSelector);
  const unit = useMaybeAccountUnit(account);

  if (!unit) return null;

  const { frozen, delegatedFrozen, unFrozen, energy, bandwidth } = account.tronResources;
  const frozenTotal = BigNumber(frozen.bandwidth?.amount || 0)
    .plus(frozen.energy?.amount || 0)
    .plus(delegatedFrozen.bandwidth?.amount || 0)
    .plus(delegatedFrozen.energy?.amount || 0)
    .plus(sumAmounts(unFrozen.bandwidth))
    .plus(sumAmounts(unFrozen.energy));
  const format = (amount: BigNumber) =>
    formatCurrencyUnit(unit, amount, {
      disableRounding: true,
      alwaysShowSign: false,
      showCode: true,
      locale,
    });
  const availableBandwidth = bandwidth.freeLimit
    .plus(bandwidth.gainedLimit)
    .minus(bandwidth.gainedUsed)
    .minus(bandwidth.freeUsed);
  const figure = (amount: BigNumber | null | undefined) =>
    amount?.gt(0) ? amount.toString() : EMPTY_FIGURE;

  const items: readonly BalanceItem[] = [
    {
      id: "available",
      label: t("account.availableBalance"),
      description: t("account.availableBalanceTooltip"),
      value: format(account.spendableBalance),
    },
    {
      id: "frozen",
      label: t("account.frozenAssets"),
      description: t("account.frozenAssetsTooltip"),
      value: format(frozenTotal),
    },
    {
      id: "bandwidth",
      label: t("account.bandwidth"),
      description: t("account.bandwidthTooltip"),
      value: figure(availableBandwidth),
    },
    {
      id: "energy",
      label: t("account.energy"),
      description: t("account.energyTooltip"),
      value: figure(energy),
    },
  ];

  return (
    <AccountBalances items={items} discreet={discreet} testID="account-detail-tron-balances" />
  );
};

const AccountDetailBalances = ({ account }: { account: TronAccount | TokenAccount }) =>
  account.type === "Account" ? <TronBalances account={account} /> : null;

export default AccountDetailBalances;
