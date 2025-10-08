import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Flex, QuickActionButtonProps, QuickActionList } from "@ledgerhq/native-ui";
import { track } from "~/analytics";
import useQuickActions, { QuickActionProps } from "../../hooks/useQuickActions";
import { BaseNavigatorStackParamList } from "../RootNavigator/types/BaseNavigator";
import { getStakeLabelLocaleBased } from "~/helpers/getStakeLabelLocaleBased";
import { useAcceptedCurrency } from "@ledgerhq/live-common/modularDrawer/hooks/useAcceptedCurrency";

const stakeLabel = getStakeLabelLocaleBased();
export const MarketQuickActions = (quickActionsProps: Required<QuickActionProps>) => {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<BaseNavigatorStackParamList>>();
  const router = useRoute();
  const { quickActionsList } = useQuickActions(quickActionsProps);
  const isAcceptedCurrency = useAcceptedCurrency();

  const isCurrencySupported = isAcceptedCurrency(quickActionsProps.currency);
  const hideQuickActions = !isCurrencySupported;

  const quickActionsData: QuickActionButtonProps[] = useMemo(
    () =>
      QUICK_ACTION_KEYS.flatMap(key => {
        const prop = QUICK_ACTIONS[key];
        const quickActionsItem = quickActionsList[key];

        if (!quickActionsItem || hideQuickActions) return [];

        return {
          variant: "small",
          textVariant: "small",
          Icon: quickActionsItem.icon,
          children: t(prop.name),
          onPress: () => {
            track("button_clicked", { button: prop.analytics, page: router.name });
            if (quickActionsItem.customHandler) {
              quickActionsItem.customHandler();
            } else if (quickActionsItem.route) {
              navigation.navigate<keyof BaseNavigatorStackParamList>(...quickActionsItem.route);
            }
          },
          disabled: quickActionsItem.disabled,
        };
      }),
    [quickActionsList, hideQuickActions, t, router.name, navigation],
  );

  if (quickActionsData.length === 0) return null;

  return (
    <Flex m={16}>
      <QuickActionList
        data={quickActionsData}
        key={quickActionsData.length}
        numColumns={quickActionsData.length}
        id="asset_five_columns"
        testID="market-quick-action-button"
      />
    </Flex>
  );
};

const QUICK_ACTIONS = {
  SEND: {
    name: "portfolio.quickActions.send",
    analytics: "quick_action_send",
  },
  RECEIVE: {
    name: "portfolio.quickActions.deposit",
    analytics: "quick_action_receive",
  },
  BUY: {
    name: "portfolio.quickActions.buy",
    analytics: "quick_action_buy",
  },
  SELL: {
    name: "portfolio.quickActions.sell",
    analytics: "quick_action_sell",
  },
  SWAP: {
    name: "portfolio.quickActions.swap",
    analytics: "quick_action_swap",
  },
  STAKE: {
    name: stakeLabel,
    analytics: "quick_action_stake",
  },
} as const;

const QUICK_ACTION_KEYS = ["SEND", "RECEIVE", "BUY", "SELL", "SWAP", "STAKE"] as const;
