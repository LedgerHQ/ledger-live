import React from "react";
import { toLocaleString, formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import type { TronAccount } from "@ledgerhq/live-common/families/tron/types";
import type { AccountLike } from "@ledgerhq/types-live";
import { AccountBalances, type BalanceItem } from "@features/flow-account-detail-balances";
import { useAccountUnit } from "LLM/hooks/useAccountUnit";
import { useTranslation } from "~/context/Locale";
import { useSelector } from "~/context/hooks";
import { useSettings } from "~/hooks";
import { discreetModeSelector } from "~/reducers/settings";

const EMPTY_FIGURE = "-";

const TronBalances = ({ account }: Readonly<{ account: TronAccount }>) => {
  const { t } = useTranslation();
  const { locale } = useSettings();
  const discreet = useSelector(discreetModeSelector);
  const unit = useAccountUnit(account);
  const { energy, bandwidth, tronPower } = account.tronResources;
  const availableBandwidth = bandwidth.freeLimit
    .plus(bandwidth.gainedLimit)
    .minus(bandwidth.gainedUsed)
    .minus(bandwidth.freeUsed);

  const items: readonly BalanceItem[] = [
    {
      id: "available",
      label: t("account.availableBalance"),
      description: t("tron.info.available.description"),
      value: formatCurrencyUnit(unit, account.spendableBalance, { showCode: true, locale }),
    },
    {
      id: "frozen",
      label: t("account.tronFrozen"),
      description: t("tron.info.frozen.description"),
      value: String(tronPower),
      sensitive: false,
    },
    {
      id: "bandwidth",
      label: t("account.bandwidth"),
      description: t("tron.info.bandwidth.description"),
      value: availableBandwidth.isZero()
        ? EMPTY_FIGURE
        : toLocaleString(availableBandwidth, locale),
      sensitive: false,
    },
    {
      id: "energy",
      label: t("account.energy"),
      description: t("tron.info.energy.description"),
      value: energy.isZero() ? EMPTY_FIGURE : toLocaleString(energy, locale),
      sensitive: false,
    },
  ];

  return (
    <AccountBalances items={items} discreet={discreet} testID="account-detail-tron-balances" />
  );
};

const AccountDetailBalances = ({ account }: Readonly<{ account: AccountLike }>) =>
  (account as TronAccount).tronResources ? <TronBalances account={account as TronAccount} /> : null;

export default AccountDetailBalances;
