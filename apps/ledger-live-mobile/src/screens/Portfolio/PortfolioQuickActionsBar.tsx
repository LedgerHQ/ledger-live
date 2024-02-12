import React, { useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { useTranslation } from "react-i18next";
import useQuickActions from "~/hooks/useQuickActions";
import { QuickActionList, type QuickActionButtonProps } from "@ledgerhq/native-ui";
import { TextVariants } from "@ledgerhq/native-ui/styles/theme";
import { track, useAnalytics } from "~/analytics";

const SHARED_CONFIG = {
  variant: "small" as const,
  textVariant: "small" as TextVariants,
};
function PortfolioQuickActionsBar() {
  const navigation = useNavigation();
  const { page } = useAnalytics();
  const { t } = useTranslation();
  const {
    quickActionsList: { SEND, RECEIVE, BUY, SWAP, STAKE },
  } = useQuickActions();

  const onNavigate = useCallback(
    (name: string, options: object, eventButton: string) => {
      track("button_clicked", { button: eventButton, page });
      (navigation as StackNavigationProp<{ [key: string]: object | undefined }>).navigate(
        name,
        options,
      );
    },
    [navigation, page],
  );

  const quickActionsData: QuickActionButtonProps[] = [
    {
      ...SHARED_CONFIG,
      Icon: BUY.icon,
      children: t("portfolio.quickActions.buy"),
      onPress: () => onNavigate(...BUY.route, "quick_action_buy"),
      disabled: BUY.disabled,
    },
    {
      ...SHARED_CONFIG,
      Icon: SWAP.icon,
      children: t("portfolio.quickActions.swap"),
      onPress: () => onNavigate(...SWAP.route, "quick_action_swap"),
      disabled: SWAP.disabled,
    },
    {
      ...SHARED_CONFIG,
      Icon: SEND.icon,
      children: t("portfolio.quickActions.send"),
      onPress: () => onNavigate(...SEND.route, "quick_action_send"),
      disabled: SEND.disabled,
    },
    {
      ...SHARED_CONFIG,
      Icon: RECEIVE.icon,
      children: t("portfolio.quickActions.deposit"),
      onPress: () => onNavigate(...RECEIVE.route, "quick_action_receive"),
      disabled: RECEIVE.disabled,
    },
  ];
  if (STAKE) {
    quickActionsData.push({
      ...SHARED_CONFIG,
      Icon: STAKE.icon,
      children: t("portfolio.quickActions.stake"),
      onPress: () => onNavigate(...STAKE.route, "quick_action_stake"),
      disabled: STAKE.disabled,
    });
  }

  return <QuickActionList data={quickActionsData} numColumns={5} id="asset_five_columns" />;
}

export default PortfolioQuickActionsBar;
