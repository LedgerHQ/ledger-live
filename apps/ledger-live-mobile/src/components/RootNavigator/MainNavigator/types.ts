import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";

type CommonTabNavigatorProps = {
  tabBar?: (props: BottomTabBarProps) => React.JSX.Element;
  screenOptions: object;
};

export type TabNavigatorProps = CommonTabNavigatorProps & {
  managerLockAwareCallback: (callback: () => void) => void;
  readOnlyModeEnabled: boolean;
  hasOrderedNano: boolean;
  navigateToRebornFlow: () => void;
};

export type Wallet40TabNavigatorProps = CommonTabNavigatorProps;

export type LegacyTabNavigatorProps = TabNavigatorProps & {
  openTransferDrawer: (params: { sourceScreenName: string }) => void;
  web3hubEnabled: boolean;
  earnYieldLabel: string;
};
