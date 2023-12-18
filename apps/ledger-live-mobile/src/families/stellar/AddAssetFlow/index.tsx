import React, { useMemo } from "react";
import { Platform } from "react-native";
import { useTranslation } from "react-i18next";
import { createStackNavigator } from "@react-navigation/stack";
import { useTheme } from "@react-navigation/native";
import { getStackNavigatorConfig, defaultNavigationOptions } from "~/navigation/navigatorConfig";
import StepHeader from "~/components/StepHeader";
import { ScreenName } from "~/const";
import SelectAsset from "./01-SelectAsset";
import SelectDevice from "~/screens/SelectDevice";
import ConnectDevice from "~/screens/ConnectDevice";
import Validation from "./03-Validation";
import ValidationError from "./03-ValidationError";
import ValidationSuccess from "./03-ValidationSuccess";
import { StellarAddAssetFlowParamList } from "./types";

function AddAssetFlow() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const stackNavigationConfig = useMemo(() => getStackNavigatorConfig(colors, true), [colors]);
  return (
    <Stack.Navigator
      screenOptions={{
        ...stackNavigationConfig,
        gestureEnabled: Platform.OS === "ios",
      }}
    >
      <Stack.Screen
        name={ScreenName.StellarAddAssetSelectAsset}
        component={SelectAsset}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("stellar.addAsset.stepperHeader.selectAsset")}
              subtitle={t("stellar.addAsset.stepperHeader.stepRange", {
                currentStep: "1",
                totalSteps: "3",
              })}
            />
          ),
          headerLeft: () => null,
          headerStyle: {
            ...defaultNavigationOptions.headerStyle,
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 0,
          },
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name={ScreenName.StellarAddAssetSelectDevice}
        component={SelectDevice}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("stellar.addAsset.stepperHeader.connectDevice")}
              subtitle={t("stellar.addAsset.stepperHeader.stepRange", {
                currentStep: "2",
                totalSteps: "3",
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.StellarAddAssetConnectDevice}
        component={ConnectDevice}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("stellar.addAsset.stepperHeader.connectDevice")}
              subtitle={t("stellar.addAsset.stepperHeader.stepRange", {
                currentStep: "2",
                totalSteps: "3",
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.StellarAddAssetValidation}
        component={Validation}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("stellar.addAsset.stepperHeader.verification")}
              subtitle={t("stellar.addAsset.stepperHeader.stepRange", {
                currentStep: "3",
                totalSteps: "3",
              })}
            />
          ),
          headerLeft: undefined,
          headerRight: undefined,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name={ScreenName.StellarAddAssetValidationError}
        component={ValidationError}
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name={ScreenName.StellarAddAssetValidationSuccess}
        component={ValidationSuccess}
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />
    </Stack.Navigator>
  );
}

const options = {
  headerShown: false,
};
export { AddAssetFlow as component, options };
const Stack = createStackNavigator<StellarAddAssetFlowParamList>();
