import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { createStackNavigator } from "@react-navigation/stack";
import { useTheme } from "styled-components/native";
import StepHeader from "../../../components/StepHeader";
import { ScreenName } from "../../../const";
import SelectDevice from "../../../screens/SelectDevice";
import ConnectDevice from "../../../screens/ConnectDevice";
import Amount from "./01-Amount";
import { getStackNavigatorConfig } from "../../../navigation/navigatorConfig";
import ValidationError from "./03-ValidationError";
import ValidationSuccess from "./03-ValidationSuccess";
import { IconUnfreezeFlowParamList } from "./type";


const totalSteps = "3";
export function IconUnfreezeFlow() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const stackNavConfig = useMemo(
    () => getStackNavigatorConfig(colors, true),
    [colors],
  );
  return (
    <Stack.Navigator screenOptions={stackNavConfig}>
      <Stack.Screen
        name={ScreenName.IconUnfreezeAmount}
        component={Amount}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("unfreeze.stepperHeader.selectAmount")}
              subtitle={t("unfreeze.stepperHeader.stepRange", {
                currentStep: "1",
                totalSteps,
              })}
            />
          ),
          headerLeft: undefined,
        }}
      />
      <Stack.Screen
        name={ScreenName.IconUnfreezeSelectDevice}
        component={SelectDevice}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("unfreeze.stepperHeader.selectDevice")}
              subtitle={t("unfreeze.stepperHeader.stepRange", {
                currentStep: "2",
                totalSteps,
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.IconUnfreezeConnectDevice}
        component={ConnectDevice}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("unfreeze.stepperHeader.connectDevice")}
              subtitle={t("unfreeze.stepperHeader.stepRange", {
                currentStep: "3",
                totalSteps,
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.IconUnfreezeValidationSuccess}
        component={ValidationSuccess}
        options={{
          headerTitle: "",
          gestureEnabled: false,
          headerLeft: undefined,
          headerRight: undefined,
        }}
      />
      <Stack.Screen
        name={ScreenName.IconUnfreezeValidationError}
        component={ValidationError}
        options={{
          headerTitle: "",
        }}
      />
    </Stack.Navigator>
  );
}

const options = {
  headerShown: false,
};

export { IconUnfreezeFlow as component, options };
const Stack = createStackNavigator<IconUnfreezeFlowParamList>();