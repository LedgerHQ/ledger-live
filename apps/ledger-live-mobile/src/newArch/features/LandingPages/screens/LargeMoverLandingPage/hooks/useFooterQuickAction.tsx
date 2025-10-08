import { useMemo } from "react";
import { QuickActionButtonProps } from "@ledgerhq/native-ui";
import { EntryOf } from "~/types/helpers";
import { useTranslation } from "react-i18next";
import { track } from "~/analytics";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import useQuickActions, { QuickActionProps } from "~/hooks/useQuickActions";
import { PAGE_NAME } from "../const";
import { useFlattenSortAccounts } from "~/actions/general";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";

const QUICK_ACTIONS = {
  BUY: {
    name: "portfolio.quickActions.buy",
    analytics: "quick_action_buy",
  },
  SWAP: {
    name: "portfolio.quickActions.swap",
    analytics: "quick_action_swap",
  },
  SELL: {
    name: "portfolio.quickActions.sell",
    analytics: "quick_action_sell",
  },
} as const;

export const useFooterQuickActions = (quickActionsProps: QuickActionProps) => {
  const { t } = useTranslation();

  const accounts = useFlattenSortAccounts().filter(
    a => getAccountCurrency(a).id === quickActionsProps.currency?.id,
  );

  const navigation = useNavigation<NativeStackNavigationProp<BaseNavigatorStackParamList>>();
  const { quickActionsList } = useQuickActions({ ...quickActionsProps, accounts });
  function trackQuickAction(
    prop: (typeof QUICK_ACTIONS)[keyof typeof QUICK_ACTIONS],
    quickActionsProps: QuickActionProps,
  ) {
    track("button_clicked", {
      button: prop.analytics,
      page: PAGE_NAME,
      coin: quickActionsProps.currency?.name,
    });
  }

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
            trackQuickAction(prop, quickActionsProps);
            navigation.navigate<keyof BaseNavigatorStackParamList>(...quickActionsItem.route);
          },
          disabled: quickActionsItem.disabled,
        };
      }),
    [quickActionsList, t, quickActionsProps, navigation],
  );
  return quickActionsData;
};
