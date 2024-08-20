import { useNavigation, useRoute } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Flex, QuickActionButtonProps, QuickActionList } from "@ledgerhq/native-ui";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { track } from "~/analytics";
import { EntryOf } from "~/types/helpers";
import useQuickActions from "../../hooks/useQuickActions";
import { BaseNavigatorStackParamList } from "../RootNavigator/types/BaseNavigator";

type Props = { currency: CryptoOrTokenCurrency };

export const MarketQuickActions = ({ currency }: Props) => {
  const { t } = useTranslation();
  const navigation = useNavigation<StackNavigationProp<BaseNavigatorStackParamList>>();
  const router = useRoute();
  const { quickActionsList } = useQuickActions({ currency });

  const quickActionsData: QuickActionButtonProps[] = useMemo(
    () =>
      (Object.entries(QUICK_ACTIONS) as EntryOf<typeof QUICK_ACTIONS>[]).flatMap(([key, prop]) => {
        const quickActionsItem = quickActionsList[key];
        if (!quickActionsItem) return [];

        return {
          variant: "small",
          textVariant: "small",
          Icon: quickActionsItem.icon,
          children: t(prop.name),
          onPress: () => {
            track("button_clicked", { button: prop.analytics, page: router.name });
            navigation.navigate<keyof BaseNavigatorStackParamList>(...quickActionsItem.route);
          },
          disabled: quickActionsItem.disabled,
        };
      }),
    [quickActionsList, t, navigation, router.name],
  );

  return (
    <Flex m={16}>
      <QuickActionList
        data={quickActionsData}
        key={quickActionsData.length}
        numColumns={quickActionsData.length}
        id="asset_five_columns"
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
    name: "portfolio.quickActions.stake",
    analytics: "quick_action_stake",
  },
} as const;
