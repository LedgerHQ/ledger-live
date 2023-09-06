import React, { useCallback } from "react";
import { ArrowDown, ArrowUp, CoinPercent, Exchange, Plus } from "@ledgerhq/native-ui/assets/icons";
import { useNavigation } from "@react-navigation/native";
import { NewIconType } from "@ledgerhq/native-ui/components/Icon/type";
import { StackNavigationProp } from "@react-navigation/stack";
import { useTranslation } from "react-i18next";
import useQuickActions from "../../hooks/useQuickActions";
import { QuickActionList, type QuickActionButtonProps } from "@ledgerhq/native-ui";
import { TextVariants } from "@ledgerhq/native-ui/styles/theme";

const SHARED_CONFIG = {
  variant: "small" as const,
  textVariant: "small" as TextVariants,
};

const getIcon =
  (Component: NewIconType) =>
  ({ color }: { color: string }) =>
    <Component size="S" color={color} />;

function PortfolioQuickActionsBar() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const {
    quickActionsList: { SEND, RECEIVE, BUY, SWAP, STAKE },
  } = useQuickActions();

  const onNavigate = useCallback(
    (name: string, options?: object) => {
      (navigation as StackNavigationProp<{ [key: string]: object | undefined }>).navigate(
        name,
        options,
      );
    },
    [navigation],
  );

  const quickActionsData: QuickActionButtonProps[] = [
    {
      ...SHARED_CONFIG,
      Icon: getIcon(Plus),
      children: t("portfolio.quickActions.buy"),
      onPress: () => onNavigate(...BUY.route),
      disabled: BUY.disabled,
    },
    {
      ...SHARED_CONFIG,
      Icon: getIcon(Exchange),
      children: t("portfolio.quickActions.swap"),
      onPress: () => onNavigate(...SWAP.route),
      disabled: SWAP.disabled,
    },
    {
      ...SHARED_CONFIG,
      Icon: getIcon(ArrowUp),
      children: t("portfolio.quickActions.send"),
      onPress: () => onNavigate(...SEND.route),
      disabled: SEND.disabled,
    },
    {
      ...SHARED_CONFIG,
      Icon: getIcon(ArrowDown),
      children: t("portfolio.quickActions.deposit"),
      onPress: () => onNavigate(...RECEIVE.route),
      disabled: RECEIVE.disabled,
    },
  ];
  if (STAKE) {
    quickActionsData.push({
      ...SHARED_CONFIG,
      Icon: getIcon(CoinPercent),
      children: t("portfolio.quickActions.stake"),
      onPress: () => onNavigate(...STAKE.route),
      disabled: STAKE.disabled,
    });
  }

  return <QuickActionList data={quickActionsData} numColumns={5} id="asset_five_columns" />;
}

export default PortfolioQuickActionsBar;
