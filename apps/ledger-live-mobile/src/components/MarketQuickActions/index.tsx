import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { QuickActionButtonProps, QuickActionList } from "@ledgerhq/native-ui";
import useQuickActions from "../../hooks/useQuickActions";

export const MarketQuickActions = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<StackNavigationProp<Record<string, object | undefined>>>();
  const { quickActionsList } = useQuickActions();

  const quickActionsData: QuickActionButtonProps[] = useMemo(
    () =>
      QUICK_ACTIONS.flatMap(action => {
        if (!quickActionsList[action]) return [];

        const { icon, route, disabled } = quickActionsList[action];
        return {
          variant: "small",
          textVariant: "small",
          Icon: icon,
          children: t(QUICK_ACTION_DATA[action].name),
          onPress: () => navigation.navigate(...(route as [string, object?])),
          disabled,
        };
      }),
    [quickActionsList, t, navigation],
  );

  return <QuickActionList data={quickActionsData} numColumns={5} id="asset_five_columns" />;
};

const QUICK_ACTIONS = ["SEND", "RECEIVE", "BUY", "SWAP", "STAKE"] as const;
const QUICK_ACTION_DATA = {
  SEND: {
    name: "portfolio.quickActions.send",
  },
  RECEIVE: {
    name: "portfolio.quickActions.deposit",
  },
  BUY: {
    name: "portfolio.quickActions.buy",
  },
  SWAP: {
    name: "portfolio.quickActions.swap",
  },
  STAKE: {
    name: "portfolio.quickActions.stake",
  },
} as const;
