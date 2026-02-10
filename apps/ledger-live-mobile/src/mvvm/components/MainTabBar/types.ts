import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import type { TabBarItemProps } from "@ledgerhq/lumen-ui-rnative";

export type TabItemConfig = Pick<TabBarItemProps, "value" | "label" | "icon" | "activeIcon">;

export interface MainTabBarViewProps {
  readonly activeRouteName: string;
  readonly tabItems: readonly TabItemConfig[];
  readonly onTabPress: (value: string) => void;
  readonly hideTabBar: boolean;
  readonly bottomInset: number;
  readonly bottomOffset: number;
}

export interface MainTabBarProps extends BottomTabBarProps {
  readonly hideTabBar?: boolean;
}
