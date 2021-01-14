// @flow
import React, { useMemo } from "react";
import { Platform } from "react-native";
import { useTranslation } from "react-i18next";
import { createStackNavigator } from "@react-navigation/stack";
import { useTheme } from "@react-navigation/native";
import { getStackNavigatorConfig } from "../../../navigation/navigatorConfig";
import StepHeader from "../../../components/StepHeader";
import { ScreenName } from "../../../const";
import UndelegationAmount from "./01-Amount";
import SelectDevice from "../../../screens/SelectDevice";
import ConnectDevice from "../../../screens/ConnectDevice";
import UndelegationValidationError from "./03-ValidationError";
import UndelegationValidationSuccess from "./03-ValidationSuccess";

const totalSteps = "3";

function UndelegationFlow() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const stackNavigationConfig = useMemo(
    () => getStackNavigatorConfig(colors, true),
    [colors],
  );
  return (
    <Stack.Navigator
      screenOptions={{
        ...stackNavigationConfig,
        gestureEnabled: Platform.OS === "ios",
      }}
    >
      <Stack.Screen
        name={ScreenName.CosmosUndelegationAmount}
        component={UndelegationAmount}
        options={({ route }) => ({
          headerTitle: () => (
            <StepHeader
              title={route.params?.delegation?.validator?.name ?? ""}
              subtitle={t("cosmos.undelegation.stepperHeader.amountSubTitle")}
            />
          ),
        })}
      />
      <Stack.Screen
        name={ScreenName.CosmosUndelegationSelectDevice}
        component={SelectDevice}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("cosmos.undelegation.stepperHeader.selectDevice")}
              subtitle={t("cosmos.undelegation.stepperHeader.stepRange", {
                currentStep: "2",
                totalSteps,
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.CosmosUndelegationConnectDevice}
        component={ConnectDevice}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("cosmos.undelegation.stepperHeader.connectDevice")}
              subtitle={t("cosmos.undelegation.stepperHeader.stepRange", {
                currentStep: "3",
                totalSteps,
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.CosmosUndelegationValidationError}
        component={UndelegationValidationError}
        options={{
          headerTitle: null,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name={ScreenName.CosmosUndelegationValidationSuccess}
        component={UndelegationValidationSuccess}
        options={{
          headerLeft: null,
          headerTitle: null,
          headerRight: null,
          gestureEnabled: false,
        }}
      />
    </Stack.Navigator>
  );
}

const options = {
  headerShown: false,
};

export { UndelegationFlow as component, options };

const Stack = createStackNavigator();
