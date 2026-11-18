import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";

type CommonTabNavigatorProps = {
  tabBar?: (props: BottomTabBarProps) => React.JSX.Element;
  screenOptions: object;
};

export type Wallet40TabNavigatorProps = CommonTabNavigatorProps & {
  isPayTabEnabled: boolean;
  isAgentIntentTabEnabled: boolean;
};
