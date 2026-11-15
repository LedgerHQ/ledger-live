import React from "react";
import type BigNumber from "bignumber.js";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import type { CardanoAccount } from "@ledgerhq/live-common/families/cardano/types";
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

const CardanoBalances = ({ account }: Readonly<{ account: CardanoAccount }>) => {
  const { t } = useTranslation();
  const { locale } = useSettings();
  const discreet = useSelector(discreetModeSelector);
  const unit = useAccountUnit(account);
  const delegation = account.cardanoResources.delegation;

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
    ...(delegation?.poolId
      ? [
          { id: "delegated", label: t("account.delegatedAssets"), value: format(account.balance) },
          {
            id: "rewards",
            label: t("cardano.delegation.drawer.rewards"),
            value: format(delegation.rewards),
          },
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

const AccountDetailBalanceSummary = ({ account }: Readonly<{ account: AccountLike }>) =>
  account.type === "Account" && (account as CardanoAccount).cardanoResources ? (
    <CardanoBalances account={account as CardanoAccount} />
  ) : null;

export default AccountDetailBalanceSummary;
