// @flow
import React from "react";
import { Platform } from "react-native";
import { useTranslation } from "react-i18next";
import { createStackNavigator } from "@react-navigation/stack";
import { closableStackNavigatorConfig } from "../../../navigation/navigatorConfig";
import StepHeader from "../../../components/StepHeader";
import { ScreenName } from "../../../const";
import UndelegationAmount from "./01-Amount";
import UndelegationConnectDevice from "./02-ConnectDevice";
import UndelegationValidation from "./03-Validation";
import UndelegationValidationError from "./03-ValidationError";
import UndelegationValidationSuccess from "./03-ValidationSuccess";

function UndelegationFlow() {
  const { t } = useTranslation();

  return (
    <Stack.Navigator
      screenOptions={{
        ...closableStackNavigatorConfig,
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
        name={ScreenName.CosmosUndelegationConnectDevice}
        component={UndelegationConnectDevice}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("cosmos.undelegation.stepperHeader.connectDevice")}
              subtitle={t("cosmos.undelegation.stepperHeader.stepRange", {
                currentStep: "2",
                totalSteps: "3",
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.CosmosUndelegationValidation}
        component={UndelegationValidation}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("cosmos.undelegation.stepperHeader.verification")}
              subtitle={t("cosmos.undelegation.stepperHeader.stepRange", {
                currentStep: "3",
                totalSteps: "3",
              })}
            />
          ),
          headerLeft: null,
          headerRight: null,
          gestureEnabled: false,
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
          headerTitle: null,
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
