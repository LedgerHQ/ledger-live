import { track } from "@shared/analytics";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { Platform } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTheme } from "styled-components/native";
import { useTranslation } from "~/context/Locale";
import { useNavigation, useRoute } from "@react-navigation/native";
import { ScreenName } from "~/const";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import SelectDevice from "LLM/features/DeviceSelection/screens/SelectDevice";
import StepHeader from "~/components/StepHeader";
import { DeviceSelectionNavigatorParamsList, SelectDeviceRouteParams } from "./types";
import CloseWithConfirmation from "LLM/components/CloseWithConfirmation";

export default function Navigator() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const route = useRoute();
  const navigation = useNavigation();

  const flowParams = (
    route.params as
      | { params?: Pick<SelectDeviceRouteParams, "onCloseNavigation" | "onAbandon"> }
      | undefined
  )?.params;

  const lifecycleRef = useRef({ generation: 0, onAbandon: flowParams?.onAbandon });
  useEffect(() => {
    lifecycleRef.current.onAbandon = flowParams?.onAbandon;
  }, [flowParams?.onAbandon]);
  // Unmount runs before the success callback, and React remounts effects once in dev.
  // Defer the abandon, and skip it when this instance mounted again or the flow already settled.
  useEffect(() => {
    const lifecycle = lifecycleRef.current;
    const generation = ++lifecycle.generation;
    return () => {
      queueMicrotask(() => {
        if (lifecycle.generation !== generation) return;
        lifecycle.onAbandon?.();
      });
    };
  }, []);

  const onClose = useCallback(() => {
    track("button_clicked", {
      button: "Close",
      screen: route.name,
    });
    flowParams?.onCloseNavigation?.();
    navigation.getParent()?.goBack();
  }, [route.name, flowParams, navigation]);

  const renderHeaderRight = useCallback(
    () => <CloseWithConfirmation onClose={onClose} />,
    [onClose],
  );

  const renderHeaderTitle = useCallback(
    () => (
      <StepHeader
        subtitle={t("transfer.receive.stepperHeader.range", {
          currentStep: "2",
          totalSteps: 3,
        })}
        title={t("transfer.receive.stepperHeader.connectDevice")}
        testID="receive-connect-device-header"
      />
    ),
    [t],
  );

  const stackNavigationConfig = useMemo(
    () => ({
      ...getStackNavigatorConfig(colors, true),
      headerRight: renderHeaderRight,
    }),
    [colors, renderHeaderRight],
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
          header: undefined,
          headerTitle: renderHeaderTitle,
        }}
        initialParams={route.params}
      />

      {/*Connect Device : Only for receive flow context it will be re-added & adjusted in https://ledgerhq.atlassian.net/browse/LIVE-14726 */}
    </Stack.Navigator>
  );
}

const Stack = createNativeStackNavigator<DeviceSelectionNavigatorParamsList>();
