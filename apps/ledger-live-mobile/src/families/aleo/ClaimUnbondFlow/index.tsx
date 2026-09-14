import React, { useMemo } from "react";
import { Platform } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTheme } from "@react-navigation/native";
import { useTranslation } from "~/context/Locale";
import { ScreenName } from "~/const";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import StepHeader from "~/components/StepHeader";
import StakingFlowPlaceholder from "../StakingFlowPlaceholder";
import type { ClaimUnbondFlowParamList } from "./types";

function ClaimUnbondFlow() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const stackNavigatorConfig = useMemo(() => getStackNavigatorConfig(colors, true), [colors]);

  return (
    <Stack.Navigator
      screenOptions={{
        ...stackNavigatorConfig,
        gestureEnabled: Platform.OS === "ios",
      }}
    >
      <Stack.Screen
        name={ScreenName.AleoClaimUnbondSelectDevice}
        component={StakingFlowPlaceholder}
        options={{
          headerTitle: () => <StepHeader title={t("aleo.claim.stepperHeader.selectDevice")} />,
        }}
      />
    </Stack.Navigator>
  );
}

const Stack = createNativeStackNavigator<ClaimUnbondFlowParamList>();
const options = { headerShown: false };
export { ClaimUnbondFlow as component, options };
