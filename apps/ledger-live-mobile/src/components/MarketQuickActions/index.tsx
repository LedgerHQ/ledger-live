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
      QUICK_ACTIONS.flatMap(key => {
        const action = quickActionsList[key];
        if (!action) return [];

        return {
          variant: "small",
          textVariant: "small",
          Icon: action.icon,
          children: t(QUICK_ACTION_DATA[key].name),
          onPress: () => navigation.navigate(...(action.route as [string, object?])),
          disabled: action.disabled,
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
