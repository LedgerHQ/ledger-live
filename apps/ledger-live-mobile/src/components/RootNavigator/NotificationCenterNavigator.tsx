import React, { useMemo, useCallback } from "react";
import { TouchableOpacity } from "react-native";
import { useTranslation } from "react-i18next";

import { createStackNavigator } from "@react-navigation/stack";
import { Flex, Icons } from "@ledgerhq/native-ui";
import { useTheme } from "styled-components/native";
import { useNavigation } from "@react-navigation/native";
import { useFilteredServiceStatus } from "@ledgerhq/live-common/notifications/ServiceStatusProvider/index";

import { useDispatch, useSelector } from "react-redux";
import NotificationCenter from "../../screens/NotificationCenter/Notifications";
import { NavigatorName, ScreenName } from "../../const";
import type { NotificationCenterNavigatorParamList } from "./types/NotificationCenterNavigator";
import { getStackNavigatorConfig } from "../../navigation/navigatorConfig";
import { track } from "../../analytics";
import { setStatusCenter } from "../../actions/settings";
import FullNodeWarning from "../../icons/FullNodeWarning";
import { accountsSelector } from "../../reducers/accounts";

const Stack = createStackNavigator<NotificationCenterNavigatorParamList>();

export default function NotificationCenterNavigator() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { colors, space } = useTheme();

  const stackNavConfig = useMemo(
    () => getStackNavigatorConfig(colors),
    [colors],
  );
  const accounts = useSelector(accountsSelector);
  console.log(
    "TICKERS",
    accounts.map(account => account.currency.ticker),
  );
  const { incidents: fullIncidents } = useFilteredServiceStatus();
  const { incidents } = useFilteredServiceStatus({
    tickers: accounts.map(account => account.currency.ticker),
  });
  console.log("ALL INCIDENTS", fullIncidents);
  console.log("INCIDENTS", incidents);

  const goToNotificationsSettings = useCallback(() => {
    track("button_clicked", {
      button: "Settings",
      screen: ScreenName.NotificationCenter,
    });
    navigation.navigate(NavigatorName.Settings, {
      screen: ScreenName.NotificationsSettings,
    });
  }, [navigation]);

  const openStatusCenter = useCallback(() => {
    track("button_clicked", {
      button: "Notification Center Status",
    });
    dispatch(setStatusCenter(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Stack.Navigator screenOptions={stackNavConfig}>
      <Stack.Screen
        name={ScreenName.NotificationCenter}
        component={NotificationCenter}
        options={{
          title: t("notificationCenter.news.title"),
          headerRight: () => (
            <Flex flexDirection="row">
              {incidents.length > 0 && (
                <TouchableOpacity
                  style={{ marginRight: space[6] }}
                  onPress={openStatusCenter}
                >
                  <FullNodeWarning
                    size={24}
                    color={colors.neutral.c100}
                    warningColor={colors.warning.c70}
                    backgroundColor={colors.background.main}
                  />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={{ marginRight: space[6] }}
                onPress={goToNotificationsSettings}
              >
                <Icons.SettingsMedium size={24} />
              </TouchableOpacity>
            </Flex>
          ),
        }}
      />
    </Stack.Navigator>
  );
}
