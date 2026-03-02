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
import { track } from "~/analytics";
import { LABELKEY_MAP, TRACKING_LABEL_MAP, TRACKING_MENUENTRY_EVENT } from "./constants";
import { scrollToTopEvent } from "./scrollToTopEvent";

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

const TAB_TEST_IDS: Partial<Record<string, string>> = {
  [NavigatorName.Portfolio]: "w40-tab-home",
  [NavigatorName.Swap]: "w40-tab-swap",
  [NavigatorName.Earn]: "w40-tab-earn",
  [NavigatorName.CardTab]: "w40-tab-card",
};

function trackTabNavigation(targetName: string, sourceName: string, value: string) {
  const entry = TRACKING_LABEL_MAP[targetName] ?? value;
  const page = TRACKING_LABEL_MAP[sourceName];
  track(TRACKING_MENUENTRY_EVENT, { entry, page });
}

function handleScrollToTop(value: string, activeRouteName: string) {
  if (value === NavigatorName.Portfolio && activeRouteName === NavigatorName.Portfolio) {
    scrollToTopEvent.emit();
  }
}

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
        testID: TAB_TEST_IDS[route.name],
        ...TAB_ICONS[route.name],
      })),
    [state.routes, t],
  );

  const navigateToTab = useCallback(
    (targetRoute: { key: string; name: string }, value: string) => {
      trackTabNavigation(targetRoute.name, state.routes[state.index].name, value);

      const event = navigation.emit({
        type: "tabPress",
        target: targetRoute.key,
        canPreventDefault: true,
      });

      if (!event.defaultPrevented) {
        navigation.navigate(value);
      }
    },
    [state, navigation],
  );

  const onTabPress = useCallback(
    (value: string) => {
      const targetRoute = state.routes.find(route => route.name === value);
      if (!targetRoute) return;

      handleScrollToTop(value, activeRouteName);

      if (activeRouteName !== value) {
        navigateToTab(targetRoute, value);
      }
    },
    [state.routes, activeRouteName, navigateToTab],
  );

  return { activeRouteName, tabItems, onTabPress };
};
