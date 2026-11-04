import { useCallback, useState } from "react";
import { Linking } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import type { CardanoAccount } from "@ledgerhq/live-common/families/cardano/types";
import { getDefaultExplorerView, getStakePoolExplorer } from "@domain/entity-currency-crypto";
import type { AccountDelegationsProps } from "@features/flow-account-detail-delegations";
import { useAccountUnit } from "LLM/hooks/useAccountUnit";
import { NavigatorName, ScreenName } from "~/const";
import { useTranslation } from "~/context/Locale";
import { useSelector } from "~/context/hooks";
import { discreetModeSelector } from "~/reducers/settings";
import { urls } from "~/utils/urls";

const REDELEGATE = "redelegate";
const UNDELEGATE = "undelegate";

export const useCardanoDelegationsViewModel = (account: CardanoAccount) => {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<Record<string, object | undefined>>>();
  const discreet = useSelector(discreetModeSelector);
  const unit = useAccountUnit(account);
  const delegation = account.cardanoResources.delegation;
  const [isSelfTxDrawerOpen, setSelfTxDrawerOpen] = useState(false);

  const formatAmount = (amount: CardanoAccount["balance"]) =>
    formatCurrencyUnit(unit, amount, {
      disableRounding: true,
      alwaysShowSign: false,
      showCode: true,
    });

  const navigateTo = useCallback(
    (route: string, screen: string, params?: object) => {
      navigation.navigate(route, { screen, params: { ...params, accountId: account.id } });
    },
    [account.id, navigation],
  );

  const onStartDelegating = useCallback(
    () => navigateTo(NavigatorName.CardanoDelegationFlow, ScreenName.CardanoDelegationStarted),
    [navigateTo],
  );

  const onSelectRowAction = useCallback(
    (_rowId: string, actionId: string) => {
      if (actionId === REDELEGATE) {
        navigateTo(NavigatorName.CardanoDelegationFlow, ScreenName.CardanoDelegationSummary);
      }
      if (actionId === UNDELEGATE) {
        const hasRewardsWithNoDrepDelegation =
          delegation?.rewards.isGreaterThan(0) && delegation.dRepHex === undefined;
        if (hasRewardsWithNoDrepDelegation) setSelfTxDrawerOpen(true);
        else {
          navigateTo(NavigatorName.CardanoUndelegationFlow, ScreenName.CardanoUndelegationSummary, {
            delegation,
          });
        }
      }
    },
    [delegation, navigateTo],
  );

  const onOpenValidator = useCallback(
    (poolId: string) => {
      const explorerView = getDefaultExplorerView(account.currency);
      const url = explorerView && getStakePoolExplorer(explorerView, poolId);
      if (url) Linking.openURL(url);
    },
    [account.currency],
  );

  const rows: AccountDelegationsProps["rows"] = delegation?.poolId
    ? [
        {
          id: delegation.poolId,
          validator: { name: delegation.name ?? delegation.poolId },
          status: delegation.status
            ? { label: t("cardano.delegation.drawer.active"), appearance: "success" }
            : { label: t("cardano.delegation.drawer.inactive"), appearance: "error" },
          cells: {
            amount: { value: formatAmount(account.balance), sensitive: true },
            rewards: { value: formatAmount(delegation.rewards), sensitive: true },
          },
          actions: [
            { id: REDELEGATE, label: t("delegation.actions.redelegate") },
            { id: UNDELEGATE, label: t("delegation.actions.undelegate") },
          ],
        },
      ]
    : [];

  const props: AccountDelegationsProps = {
    title: t("cardano.delegation.header"),
    columns: [
      { id: "amount", label: t("account.delegatedAssets") },
      { id: "rewards", label: t("cardano.delegation.drawer.rewards") },
    ],
    rows,
    emptyState: {
      description: t("cardano.delegation.delegationEarn", { name: account.currency.name }),
      learnMoreLabel: t("cardano.delegation.info"),
      actionLabel: t("account.delegation.info.cta"),
    },
    discreet,
    rowActionsLabel: t("common.seeMore"),
    openValidatorLabel: t("cardano.delegation.poolId"),
    onOpenValidator,
    onSelectRowAction,
    onSelectHeaderAction: onStartDelegating,
    onStartDelegating,
    onLearnMore: () => Linking.openURL(urls.cardanoStaking),
    testID: "account-detail-cardano-delegations",
  };

  return {
    props,
    selfTxDrawer: { isOpen: isSelfTxDrawerOpen, onClose: () => setSelfTxDrawerOpen(false) },
  };
};
