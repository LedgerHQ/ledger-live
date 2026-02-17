import { useCallback, useMemo } from "react";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import {
  Home,
  HomeFill,
  Chart5,
  Exchange,
  ExchangeFill,
  Compass,
  LedgerDevices,
} from "@ledgerhq/lumen-ui-rnative/symbols";
import { NavigatorName, ScreenName } from "~/const";
import type { TabItemConfig, MainTabBarViewProps } from "./types";

type UseMainTabBarViewModelParams = Pick<BottomTabBarProps, "state" | "navigation">;

type UseMainTabBarViewModelReturn = Pick<
  MainTabBarViewProps,
  "activeRouteName" | "tabItems" | "onTabPress"
>;

type TabIconConfig = { icon: TabItemConfig["icon"]; activeIcon?: TabItemConfig["activeIcon"] };

const TAB_ICONS: Partial<Record<string, TabIconConfig>> = {
  [NavigatorName.Portfolio]: { icon: Home, activeIcon: HomeFill },
  [NavigatorName.Earn]: { icon: Chart5 },
  [ScreenName.Transfer]: { icon: Exchange, activeIcon: ExchangeFill },
  [NavigatorName.Discover]: { icon: Compass },
  [NavigatorName.Web3HubTab]: { icon: Compass },
  [NavigatorName.MyLedger]: { icon: LedgerDevices },
};

const LABEL_MAP: Partial<Record<string, string>> = {
  [NavigatorName.Portfolio]: "Home",
  [NavigatorName.Earn]: "Earn",
  [ScreenName.Transfer]: "Transfer",
  [NavigatorName.Discover]: "Discover",
  [NavigatorName.Web3HubTab]: "Discover",
  [NavigatorName.MyLedger]: "Ledger",
};

export const useMainTabBarViewModel = ({
  state,
  navigation,
}: UseMainTabBarViewModelParams): UseMainTabBarViewModelReturn => {
  const activeRouteName = state.routes[state.index].name;

  const tabItems: readonly TabItemConfig[] = useMemo(
    () =>
      state.routes.map(route => ({
        value: route.name,
        label: LABEL_MAP[route.name] ?? route.name,
        ...TAB_ICONS[route.name],
      })),
    [state.routes],
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
