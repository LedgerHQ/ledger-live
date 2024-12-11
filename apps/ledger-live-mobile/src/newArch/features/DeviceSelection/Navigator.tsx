import React, { useCallback, useMemo } from "react";
import { Platform } from "react-native";
import { createStackNavigator } from "@react-navigation/stack";
import { useTheme } from "styled-components/native";
import { useTranslation } from "react-i18next";
import { NavigationProp, useRoute } from "@react-navigation/native";
import { ScreenName } from "~/const";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import { track } from "~/analytics";
import SelectDevice, {
  addAccountsSelectDeviceHeaderOptions,
} from "LLM/features/DeviceSelection/screens/SelectDevice";
import ConnectDevice, {
  connectDeviceHeaderOptions,
} from "LLM/features/DeviceSelection/screens/ConnectDevice";
import StepHeader from "~/components/StepHeader";
import { NavigationHeaderCloseButtonAdvanced } from "~/components/NavigationHeaderCloseButton";
import { DeviceSelectionNavigatorParamsList } from "./types";

export default function Navigator() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const route = useRoute();

  const onClose = useCallback(() => {
    track("button_clicked", {
      button: "Close",
      screen: route.name,
    });
  }, [route]);

  const stackNavigationConfig = useMemo(
    () => ({
      ...getStackNavigatorConfig(colors, true),
      headerRight: () => <NavigationHeaderCloseButtonAdvanced onClose={onClose} />,
    }),
    [colors, onClose],
  );

  const onConnectDeviceBack = useCallback((navigation: NavigationProp<Record<string, unknown>>) => {
    track("button_clicked", {
      button: "Back arrow",
      page: ScreenName.ConnectDevice,
    });
    navigation.goBack();
  }, []);

  return (
    <Stack.Navigator
      screenOptions={{
        ...stackNavigationConfig,
        gestureEnabled: Platform.OS === "ios",
      }}
    >
      {/* Select Device */}
      <Stack.Screen
        name={ScreenName.SelectDevice}
        component={SelectDevice}
        options={{
          headerTitle: () => (
            <StepHeader
              subtitle={t("transfer.receive.stepperHeader.range", {
                currentStep: "2",
                totalSteps: 3,
              })}
              title={t("transfer.receive.stepperHeader.connectDevice")}
            />
          ),
          ...addAccountsSelectDeviceHeaderOptions(onClose),
        }}
        initialParams={route.params}
      />

      {/* Select / Connect Device */}
      <Stack.Screen
        name={ScreenName.ConnectDevice}
        component={ConnectDevice}
        options={({ navigation }) => ({
          headerTitle: () => (
            <StepHeader
              subtitle={t("transfer.receive.stepperHeader.range", {
                currentStep: "2",
                totalSteps: 3,
              })}
              title={t("transfer.receive.stepperHeader.connectDevice")}
            />
          ),
          ...connectDeviceHeaderOptions(() => onConnectDeviceBack(navigation)),
        })}
      />
    </Stack.Navigator>
  );
}

const Stack = createStackNavigator<DeviceSelectionNavigatorParamsList>();
