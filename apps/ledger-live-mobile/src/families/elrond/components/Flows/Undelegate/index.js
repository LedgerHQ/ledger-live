// @flow
import React, { useMemo } from "react";
import { Platform } from "react-native";
import { useTranslation } from "react-i18next";
import { createStackNavigator } from "@react-navigation/stack";
import { useTheme } from "@react-navigation/native";
import { getStackNavigatorConfig } from "../../../../../navigation/navigatorConfig";
import StepHeader from "../../../../../components/StepHeader";
import { ScreenName } from "../../../../../const";
import UndelegationAmount from "./01-Amount.jsx";
import SelectDevice from "../../../../../screens/SelectDevice";
import ConnectDevice from "../../../../../screens/ConnectDevice";
import UndelegationValidationError from "./03-ValidationError.jsx";
import UndelegationValidationSuccess from "./03-ValidationSuccess.jsx";

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
        name={ScreenName.ElrondUndelegationAmount}
        component={UndelegationAmount}
        options={({ route }) => ({
          headerTitle: () => (
            <StepHeader
              title={route.params?.delegation?.validator?.name ?? ""}
              subtitle={t("elrond.undelegation.stepperHeader.amountSubTitle")}
            />
          ),
        })}
      />
      <Stack.Screen
        name={ScreenName.ElrondUndelegationSelectDevice}
        component={SelectDevice}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("elrond.undelegation.stepperHeader.selectDevice")}
              subtitle={t("elrond.undelegation.stepperHeader.stepRange", {
                currentStep: "2",
                totalSteps,
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.ElrondUndelegationConnectDevice}
        component={ConnectDevice}
        options={{
          headerLeft: null,
          gestureEnabled: false,
          headerTitle: () => (
            <StepHeader
              title={t("elrond.undelegation.stepperHeader.connectDevice")}
              subtitle={t("elrond.undelegation.stepperHeader.stepRange", {
                currentStep: "3",
                totalSteps,
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.ElrondUndelegationValidationError}
        component={UndelegationValidationError}
        options={{
          headerTitle: null,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name={ScreenName.ElrondUndelegationValidationSuccess}
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
