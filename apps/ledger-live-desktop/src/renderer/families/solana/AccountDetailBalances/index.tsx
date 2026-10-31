import React from "react";
import { BigNumber } from "bignumber.js";
import { useTranslation } from "react-i18next";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { listSolanaStakingPositions } from "@ledgerhq/live-common/families/solana/logic";
import type { SolanaAccount } from "@ledgerhq/live-common/families/solana/types";
import type { TokenAccount } from "@ledgerhq/types-live";
import { AccountBalances, type BalanceItem } from "@features/flow-account-detail-balances";
import { useSelector } from "LLD/hooks/redux";
import { useDiscreetMode } from "~/renderer/components/Discreet";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";
import { localeSelector } from "~/renderer/reducers/settings";

const SolanaBalances = ({ account }: { account: SolanaAccount }) => {
  const { t } = useTranslation();
  const discreet = useDiscreetMode();
  const locale = useSelector(localeSelector);
  const unit = useAccountUnit(account);

  const positions = listSolanaStakingPositions(account.stakingResources);
  const sum = (amountOf: (position: (typeof positions)[number]) => BigNumber.Value | undefined) =>
    positions.reduce((total, position) => total.plus(amountOf(position) ?? 0), new BigNumber(0));
  const delegated = sum(({ amount }) => amount);
  const inactive = sum(({ inactiveAmount }) => inactiveAmount);
  const withdrawable = sum(({ withdrawableAmount }) => withdrawableAmount);

  const format = (amount: BigNumber) =>
    formatCurrencyUnit(unit, amount, {
      disableRounding: true,
      alwaysShowSign: false,
      showCode: true,
      locale,
    });

  const items: readonly BalanceItem[] = [
    {
      id: "available",
      label: t("account.availableBalance"),
      description: t("account.availableBalanceTooltip"),
      value: format(account.spendableBalance),
    },
    {
      id: "delegated",
      label: t("account.delegatedAssets"),
      description: t("solana.delegation.delegatedInfoTooltip"),
      value: format(delegated),
    },
    ...(inactive.gt(0)
      ? [
          {
            id: "inactive",
            label: t("solana.delegation.inactiveStakeTitle"),
            description: t("solana.delegation.inactiveStakeTooltip"),
            value: format(inactive),
          },
        ]
      : []),
    ...(withdrawable.gt(0)
      ? [
          {
            id: "withdrawable",
            label: t("solana.delegation.withdrawableTitle"),
            description: t("solana.delegation.withdrawableInfoTooltip"),
            value: format(withdrawable),
          },
        ]
      : []),
  ];

  return (
    <AccountBalances items={items} discreet={discreet} testID="account-detail-solana-balances" />
  );
};

const AccountDetailBalances = ({ account }: { account: SolanaAccount | TokenAccount }) =>
  account.type === "Account" ? <SolanaBalances account={account} /> : null;

export default AccountDetailBalances;
