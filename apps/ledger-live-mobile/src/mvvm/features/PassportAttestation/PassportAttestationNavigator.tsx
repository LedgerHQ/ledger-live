import React, { useMemo } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTheme } from "styled-components/native";
import { ScreenName } from "~/const";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import type { PassportAttestationNavigatorStackParamList } from "~/components/RootNavigator/types/PassportAttestationNavigator";
import ScanMRZScreen from "./screens/ScanMRZ";
import ReadNFCScreen from "./screens/ReadNFC";
import ConfirmScreen from "./screens/Confirm";
import GenerateProofScreen from "./screens/GenerateProof";
import SuccessScreen from "./screens/Success";

const Stack = createNativeStackNavigator<PassportAttestationNavigatorStackParamList>();

export default function PassportAttestationNavigator() {
  const { colors } = useTheme();
  const stackNavConfig = useMemo(() => getStackNavigatorConfig(colors), [colors]);

  return (
    <Stack.Navigator screenOptions={stackNavConfig}>
      <Stack.Screen
        name={ScreenName.PassportAttestationScanMRZ}
        component={ScanMRZScreen}
        options={{ title: "Passport Verification" }}
      />
      <Stack.Screen
        name={ScreenName.PassportAttestationReadNFC}
        component={ReadNFCScreen}
        options={{ title: "Reading Passport", headerBackVisible: false }}
      />
      <Stack.Screen
        name={ScreenName.PassportAttestationConfirm}
        component={ConfirmScreen}
        options={{ title: "Confirm Details" }}
      />
      <Stack.Screen
        name={ScreenName.PassportAttestationGenerateProof}
        component={GenerateProofScreen}
        options={{ title: "Generating Proof", headerBackVisible: false }}
      />
      <Stack.Screen
        name={ScreenName.PassportAttestationSuccess}
        component={SuccessScreen}
        options={{ title: "", headerLeft: () => null, headerRight: () => null }}
      />
    </Stack.Navigator>
  );
}
