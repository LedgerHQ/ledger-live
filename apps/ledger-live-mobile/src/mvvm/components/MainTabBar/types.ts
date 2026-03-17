import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import type { TabBarItemProps } from "@ledgerhq/lumen-ui-rnative";

export type TabItemConfig = Pick<
  TabBarItemProps,
  "value" | "label" | "icon" | "activeIcon" | "testID"
>;

export interface MainTabBarViewProps {
  readonly activeRouteName: string;
  readonly tabItems: readonly TabItemConfig[];
  readonly onTabPress: (value: string) => void;
  readonly hideTabBar: boolean;
  readonly bottomInset: number;
  readonly bottomOffset: number;
  readonly gradientColors: [string, string, string];
  /** When true (e.g. Reduce Transparency on), use solid background in TabBar instead of BlurView. */
  readonly useSolidTabBarBackground: boolean;
}

export interface MainTabBarProps extends BottomTabBarProps {
  readonly hideTabBar?: boolean;
}
