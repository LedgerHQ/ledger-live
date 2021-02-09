// @flow

import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { createStackNavigator } from "@react-navigation/stack";
import { useTheme } from "@react-navigation/native";
import { ScreenName } from "../../../const";
import { getStackNavigatorConfig } from "../../../navigation/navigatorConfig";
import StepHeader from "../../../components/StepHeader";

import Started from "./01-Started";
import SelectDevice from "../../../screens/SelectDevice";
import ConnectDevice from "../../../screens/ConnectDevice";
import ValidationSuccess from "./03-ValidationSuccess";
import ValidationError from "./03-ValidationError";

const totalSteps = "2";

function SimpleOperationFlow() {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const stackNavigatorConfig = useMemo(
    () => getStackNavigatorConfig(colors, true),
    [colors],
  );

  return (
    <Stack.Navigator screenOptions={stackNavigatorConfig}>
      <Stack.Screen
        name={ScreenName.PolkadotSimpleOperationStarted}
        component={Started}
        options={({ route }) => ({
          title: route.params.mode
            ? t(`polkadot.simpleOperation.modes.${route.params.mode}.title`)
            : t("polkadot.simpleOperation.stepperHeader.info"),
          headerLeft: null,
        })}
      />
      <Stack.Screen
        name={ScreenName.PolkadotSimpleOperationSelectDevice}
        component={SelectDevice}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("polkadot.simpleOperation.stepperHeader.selectDevice")}
              subtitle={t("polkadot.simpleOperation.stepperHeader.stepRange", {
                currentStep: "1",
                totalSteps,
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.PolkadotSimpleOperationConnectDevice}
        component={ConnectDevice}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("polkadot.simpleOperation.stepperHeader.connectDevice")}
              subtitle={t("polkadot.simpleOperation.stepperHeader.stepRange", {
                currentStep: "2",
                totalSteps,
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.PolkadotSimpleOperationValidationSuccess}
        component={ValidationSuccess}
        options={{
          headerTitle: null,
          gestureEnabled: false,
          headerLeft: null,
          headerRight: null,
        }}
      />
      <Stack.Screen
        name={ScreenName.PolkadotSimpleOperationValidationError}
        component={ValidationError}
        options={{ headerTitle: null }}
      />
    </Stack.Navigator>
  );
}

const options = {
  headerShown: false,
};

export { SimpleOperationFlow as component, options };

const Stack = createStackNavigator();
