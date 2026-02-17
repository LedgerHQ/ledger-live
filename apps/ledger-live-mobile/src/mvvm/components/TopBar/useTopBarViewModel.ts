import { useCallback, useMemo } from "react";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { NavigatorName, ScreenName } from "~/const";
import useDynamicContent from "~/dynamicContent/useDynamicContent";
import { track } from "~/analytics";

export function useTopBarViewModel(
  navigation: NativeStackNavigationProp<{ [key: string]: object | undefined }>,
  screenName?: string,
) {
  const { notificationCards } = useDynamicContent();
  const page = screenName ?? ScreenName.Portfolio;

  const hasUnreadNotifications = useMemo(
    () => notificationCards.some(n => !n.viewed),
    [notificationCards],
  );

  const onMyLedgerPress = useCallback(() => {
    track("menuentry_clicked", { button: "MyLedger", page });
    navigation.navigate(NavigatorName.MyLedger, {
      screen: ScreenName.MyLedgerChooseDevice,
      params: {
        tab: undefined,
        searchQuery: undefined,
        updateModalOpened: undefined,
      },
    });
  }, [navigation, page]);

  const onDiscoverPress = useCallback(() => {
    track("menuentry_clicked", { button: "Discover", page });
    navigation.navigate(NavigatorName.Discover, {
      screen: ScreenName.DiscoverScreen,
    });
  }, [navigation, page]);

  const onNotificationsPress = useCallback(() => {
    track("menuentry_clicked", { button: "Notifications", page });
    navigation.navigate(NavigatorName.NotificationCenter, {
      screen: ScreenName.NotificationCenter,
    });
  }, [navigation, page]);

  const onSettingsPress = useCallback(() => {
    track("menuentry_clicked", { button: "Settings" });
    navigation.navigate(NavigatorName.Settings);
  }, [navigation]);

  return {
    onMyLedgerPress,
    onDiscoverPress,
    onNotificationsPress,
    onSettingsPress,
    hasUnreadNotifications,
  };
}
