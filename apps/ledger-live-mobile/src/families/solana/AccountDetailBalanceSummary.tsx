import React from "react";
import { BigNumber } from "bignumber.js";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { listSolanaStakingPositions } from "@ledgerhq/live-common/families/solana/logic";
import type { SolanaAccount } from "@ledgerhq/live-common/families/solana/types";
import type { AccountLike } from "@ledgerhq/types-live";
import {
  AccountBalanceSummary,
  type BalanceItem,
} from "@features/flow-account-detail-balance-summary";
import { useAccountUnit } from "LLM/hooks/useAccountUnit";
import { useTranslation } from "~/context/Locale";
import { useSelector } from "~/context/hooks";
import { useSettings } from "~/hooks";
import { discreetModeSelector } from "~/reducers/settings";

type Position = ReturnType<typeof listSolanaStakingPositions>[number];

const sumOf = (
  positions: readonly Position[],
  amountOf: (position: Position) => BigNumber.Value | undefined,
) => positions.reduce((total, position) => total.plus(amountOf(position) ?? 0), new BigNumber(0));

const SolanaBalanceSummary = ({ account }: Readonly<{ account: SolanaAccount }>) => {
  const { t } = useTranslation();
  const { locale } = useSettings();
  const discreet = useSelector(discreetModeSelector);
  const unit = useAccountUnit(account);

  const positions = listSolanaStakingPositions(account.stakingResources);
  const delegated = sumOf(positions, ({ amount }) => amount);
  const inactive = sumOf(positions, ({ inactiveAmount }) => inactiveAmount);
  const withdrawable = sumOf(positions, ({ withdrawableAmount }) => withdrawableAmount);

  const format = (amount: BigNumber) =>
    formatCurrencyUnit(unit, amount, { showCode: true, locale });

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
            label: t("solana.delegation.inactiveStake"),
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
    <AccountBalanceSummary
      items={items}
      discreet={discreet}
      testID="account-detail-solana-balance-summary"
    />
  );
};

const AccountDetailBalanceSummary = ({ account }: Readonly<{ account: AccountLike }>) =>
  (account as SolanaAccount).stakingResources ? (
    <SolanaBalanceSummary account={account as SolanaAccount} />
  ) : null;

export default AccountDetailBalanceSummary;
