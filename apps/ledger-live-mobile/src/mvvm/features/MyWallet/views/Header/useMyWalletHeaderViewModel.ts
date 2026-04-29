import { useCallback, useMemo } from "react";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { NavigatorName, ScreenName } from "~/const";
import { track } from "~/analytics";
import useDynamicContent from "~/dynamicContent/useDynamicContent";

export function useMyWalletHeaderViewModel() {
  const navigation =
    useNavigation<NativeStackNavigationProp<{ [key: string]: object | undefined }>>();
  const { notificationCards } = useDynamicContent();

  const hasUnreadNotifications = useMemo(
    () => notificationCards.some(n => !n.viewed),
    [notificationCards],
  );

  const onBackPress = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const onNotificationsPress = useCallback(() => {
    track("button_clicked", { button: "Notifications", page: ScreenName.MyWallet });
    navigation.navigate(NavigatorName.NotificationCenter, {
      screen: ScreenName.NotificationCenter,
    });
  }, [navigation]);

  const onSettingsPress = useCallback(() => {
    track("button_clicked", { button: "Settings", page: ScreenName.MyWallet });
    navigation.navigate(NavigatorName.Settings);
  }, [navigation]);

  return {
    onBackPress,
    onNotificationsPress,
    onSettingsPress,
    hasUnreadNotifications,
  };
}
