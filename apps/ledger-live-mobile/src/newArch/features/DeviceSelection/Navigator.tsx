import React, { useCallback, useMemo } from "react";
import { Platform } from "react-native";
import { createStackNavigator } from "@react-navigation/stack";
import { useTheme } from "styled-components/native";
import { useTranslation } from "react-i18next";
import { useNavigation, useRoute } from "@react-navigation/native";
import { ScreenName } from "~/const";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import { track } from "~/analytics";
import SelectDevice from "LLM/features/DeviceSelection/screens/SelectDevice";
import StepHeader from "~/components/StepHeader";
import { DeviceSelectionNavigatorParamsList } from "./types";
import CloseWithConfirmation from "LLM/components/CloseWithConfirmation";
import { extractParam } from "./utils/navigationHelpers";
import { NavigationHeaderBackButton } from "~/components/NavigationHeaderBackButton";
import { useModularDrawer } from "LLM/features/ModularDrawer/hooks/useModularDrawer";
import { MODULAR_DRAWER_KEY, ModularDrawerNavigationParams } from "../ModularDrawer/types";

export default function Navigator() {
  const { initDrawer } = useModularDrawer();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const route = useRoute();
  const navigation = useNavigation();

  const modularDrawer = extractParam<ModularDrawerNavigationParams>(
    route.params,
    MODULAR_DRAWER_KEY,
  );

  const onClose = useCallback(() => {
    track("button_clicked", {
      button: "Close",
      screen: route.name,
    });
    navigation.getParent()?.goBack();
  }, [route, navigation]);

  const onBack = useCallback(() => {
    navigation.goBack();

    if (modularDrawer?.isFromModularDrawer) {
      initDrawer(modularDrawer?.asset, modularDrawer?.network, modularDrawer?.step);
    }
  }, [navigation, initDrawer, modularDrawer]);

  const stackNavigationConfig = useMemo(
    () => ({
      ...getStackNavigatorConfig(colors, true),
      headerRight: () => <CloseWithConfirmation onClose={onClose} />,
      ...(modularDrawer?.isFromModularDrawer && {
        headerLeft: () => <NavigationHeaderBackButton onPress={onBack} />,
      }),
    }),
    [colors, modularDrawer, onClose, onBack],
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
        }}
        initialParams={route.params}
      />

      {/*Connect Device : Only for receive flow context it will be re-added & adjusted in https://ledgerhq.atlassian.net/browse/LIVE-14726 */}
    </Stack.Navigator>
  );
}

const Stack = createStackNavigator<DeviceSelectionNavigatorParamsList>();
