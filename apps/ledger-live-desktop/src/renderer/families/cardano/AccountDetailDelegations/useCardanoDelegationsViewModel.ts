import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { shortAddressPreview } from "@ledgerhq/live-common/account/index";
import type { CardanoAccount } from "@ledgerhq/live-common/families/cardano/types";
import type { AccountDelegationsProps } from "@features/flow-account-detail-delegations";
import { useDispatch } from "LLD/hooks/redux";
import { urls } from "~/config/urls";
import { openModal } from "~/renderer/actions/modals";
import { useDiscreetMode } from "~/renderer/components/Discreet";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";
import { openURL } from "~/renderer/linking";

const REDELEGATE = "redelegate";
const UNDELEGATE = "undelegate";

export const useCardanoDelegationsViewModel = (
  account: CardanoAccount,
): AccountDelegationsProps => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const discreet = useDiscreetMode();
  const unit = useAccountUnit(account);
  const delegation = account.cardanoResources.delegation;

  const formatAmount = (amount: CardanoAccount["balance"]) =>
    formatCurrencyUnit(unit, amount, {
      disableRounding: true,
      alwaysShowSign: false,
      showCode: true,
    });

  const onSelectRowAction = useCallback(
    (_rowId: string, actionId: string) => {
      if (actionId === REDELEGATE) dispatch(openModal("MODAL_CARDANO_DELEGATE", { account }));
      if (actionId === UNDELEGATE) {
        const hasRewardsWithNoDrepDelegation =
          delegation?.rewards.isGreaterThan(0) && delegation.dRepHex === undefined;
        dispatch(
          openModal(
            hasRewardsWithNoDrepDelegation
              ? "MODAL_CARDANO_UNDELEGATE_SELF_TX_INFO"
              : "MODAL_CARDANO_UNDELEGATE",
            { account },
          ),
        );
      }
    },
    [account, delegation, dispatch],
  );

  const onStartDelegating = useCallback(() => {
    dispatch(openModal("MODAL_CARDANO_REWARDS_INFO", { account }));
  }, [account, dispatch]);

  const rows: AccountDelegationsProps["rows"] = delegation?.poolId
    ? [
        {
          id: delegation.poolId,
          validator: {
            name: delegation.ticker
              ? `${delegation.ticker} - ${delegation.name}`
              : shortAddressPreview(delegation.poolId),
          },
          cells: {
            amount: { value: formatAmount(account.balance), sensitive: true },
            rewards: { value: formatAmount(delegation.rewards), sensitive: true },
          },
          actions: [
            { id: REDELEGATE, label: t("cardano.delegation.changeDelegation") },
            { id: UNDELEGATE, label: t("delegation.contextMenu.stopDelegation") },
          ],
        },
      ]
    : [];

  return {
    title: t("delegation.header"),
    validatorColumnLabel: t("cardano.delegation.pool"),
    columns: [
      { id: "amount", label: t("delegation.amount") },
      { id: "rewards", label: t("delegation.rewards") },
    ],
    rows,
    emptyState: {
      description: t("delegation.delegationEarn", { name: account.currency.name }),
      learnMoreLabel: t("delegation.howItWorks"),
      actionLabel: t("delegation.title"),
    },
    discreet,
    rowActionsLabel: t("common.manage"),
    onSelectRowAction,
    onSelectHeaderAction: onStartDelegating,
    onStartDelegating,
    onLearnMore: () => openURL(urls.cardanoStakingRewards),
    testID: "account-detail-cardano-delegations",
  };
};
