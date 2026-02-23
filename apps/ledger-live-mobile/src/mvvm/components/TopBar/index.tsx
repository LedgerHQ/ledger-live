import React from "react";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTopBarViewModel } from "./useTopBarViewModel";
import { TopBarView } from "./TopBarView";

type TopBarProps = {
  screenName?: string;
};

export function TopBar({ screenName }: Readonly<TopBarProps>) {
  const navigation =
    useNavigation<NativeStackNavigationProp<{ [key: string]: object | undefined }>>();
  const {
    onMyLedgerPress,
    onDiscoverPress,
    onNotificationsPress,
    onSettingsPress,
    hasUnreadNotifications,
  } = useTopBarViewModel(navigation, screenName);

  return (
    <TopBarView
      onMyLedgerPress={onMyLedgerPress}
      onDiscoverPress={onDiscoverPress}
      onNotificationsPress={onNotificationsPress}
      onSettingsPress={onSettingsPress}
      hasUnreadNotifications={hasUnreadNotifications}
    />
  );
}
