import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { createStackNavigator } from "@react-navigation/stack";
import { useTheme } from "styled-components/native";
import StepHeader from "../../../components/StepHeader";
import { ScreenName } from "../../../const";
import SelectDevice from "../../../screens/SelectDevice";
import ConnectDevice from "../../../screens/ConnectDevice";
import Info from "./01-Info";
import Amount from "./02-Amount";
import { getStackNavigatorConfig } from "../../../navigation/navigatorConfig";
import ValidationError from "./04-ValidationError";
import ValidationSuccess from "./04-ValidationSuccess";
import { IconFreezeFlowParamList } from "./type";


const totalSteps = "3";
export function IconFreezeFlow() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const stackNavConfig = useMemo(
    () => getStackNavigatorConfig(colors, true),
    [colors],
  );
  return (
    <Stack.Navigator screenOptions={stackNavConfig}>
      <Stack.Screen
        name={ScreenName.IconFreezeInfo}
        component={Info}
        options={{
          headerTitle: () => (
            <StepHeader title={t("freeze.stepperHeader.info")} />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.IconFreezeAmount}
        component={Amount}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("freeze.stepperHeader.selectAmount")}
              subtitle={t("freeze.stepperHeader.stepRange", {
                currentStep: "1",
                totalSteps,
              })}
            />
          ),
          headerLeft: undefined,
        }}
      />
      <Stack.Screen
        name={ScreenName.IconFreezeSelectDevice}
        component={SelectDevice}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("freeze.stepperHeader.selectDevice")}
              subtitle={t("freeze.stepperHeader.stepRange", {
                currentStep: "2",
                totalSteps,
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.IconFreezeConnectDevice}
        component={ConnectDevice}
        options={{
          headerTitle: () => (
            <StepHeader
              title={t("freeze.stepperHeader.connectDevice")}
              subtitle={t("freeze.stepperHeader.stepRange", {
                currentStep: "3",
                totalSteps,
              })}
            />
          ),
        }}
      />
      <Stack.Screen
        name={ScreenName.IconFreezeValidationSuccess}
        component={ValidationSuccess}
        options={{
          headerTitle: "",
          gestureEnabled: false,
          headerLeft: undefined,
          headerRight: undefined,
        }}
      />
      <Stack.Screen
        name={ScreenName.IconFreezeValidationError}
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

export { IconFreezeFlow as component, options };
const Stack = createStackNavigator<IconFreezeFlowParamList>();