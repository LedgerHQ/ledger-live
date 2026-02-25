import { useCallback, useMemo } from "react";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import {
  Home,
  HomeFill,
  Chart5,
  Chart5Fill,
  Exchange,
  ExchangeFill,
  CreditCard,
  CreditCardFill,
} from "@ledgerhq/lumen-ui-rnative/symbols";
import { NavigatorName } from "~/const";
import type { TabItemConfig, MainTabBarViewProps } from "./types";
import { useTranslation } from "~/context/Locale";

type UseMainTabBarViewModelParams = Pick<BottomTabBarProps, "state" | "navigation">;

type UseMainTabBarViewModelReturn = Pick<
  MainTabBarViewProps,
  "activeRouteName" | "tabItems" | "onTabPress"
>;

type TabIconConfig = { icon: TabItemConfig["icon"]; activeIcon?: TabItemConfig["activeIcon"] };

const TAB_ICONS: Partial<Record<string, TabIconConfig>> = {
  [NavigatorName.Portfolio]: { icon: Home, activeIcon: HomeFill },
  [NavigatorName.Swap]: { icon: Exchange, activeIcon: ExchangeFill },
  [NavigatorName.Earn]: { icon: Chart5, activeIcon: Chart5Fill },
  [NavigatorName.CardTab]: { icon: CreditCard, activeIcon: CreditCardFill },
};

const LABELKEY_MAP: Partial<Record<string, string>> = {
  [NavigatorName.Portfolio]: "mainNavigation.home",
  [NavigatorName.Swap]: "mainNavigation.swap",
  [NavigatorName.Earn]: "mainNavigation.earn",
  [NavigatorName.CardTab]: "mainNavigation.card",
};

export const useMainTabBarViewModel = ({
  state,
  navigation,
}: UseMainTabBarViewModelParams): UseMainTabBarViewModelReturn => {
  const activeRouteName = state.routes[state.index].name;
  const { t } = useTranslation();

  const tabItems: readonly TabItemConfig[] = useMemo(
    () =>
      state.routes.map(route => ({
        value: route.name,
        label: t(LABELKEY_MAP[route.name] ?? route.name),
        ...TAB_ICONS[route.name],
      })),
    [state.routes, t],
  );

  const onTabPress = useCallback(
    (value: string) => {
      const targetRoute = state.routes.find(route => route.name === value);
      if (!targetRoute) return;

      const event = navigation.emit({
        type: "tabPress",
        target: targetRoute.key,
        canPreventDefault: true,
      });

      const isFocused = activeRouteName === value;

      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(value);
      }
    },
    [state.routes, navigation, activeRouteName],
  );

  return { activeRouteName, tabItems, onTabPress };
};
