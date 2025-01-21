import React, { useCallback, useMemo } from "react";
import { Platform } from "react-native";
import { createStackNavigator } from "@react-navigation/stack";
import { useTheme } from "styled-components/native";
import { useTranslation } from "react-i18next";
import { useRoute } from "@react-navigation/native";
import { ScreenName } from "~/const";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import { track } from "~/analytics";
import SelectDevice, {
  addAccountsSelectDeviceHeaderOptions,
} from "LLM/features/DeviceSelection/screens/SelectDevice";
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

      {/*Connect Device : Only for receive flow context it will be re-added & adjusted in https://ledgerhq.atlassian.net/browse/LIVE-14726 */}
    </Stack.Navigator>
  );
}

const Stack = createStackNavigator<DeviceSelectionNavigatorParamsList>();
