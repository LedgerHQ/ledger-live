import React, { useMemo } from "react";
import {
  createNativeStackNavigator,
  type NativeStackNavigationOptions,
  type NativeStackNavigationProp,
} from "@react-navigation/native-stack";
import { useTheme } from "styled-components/native";
import { ScreenName } from "~/const";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import type { PassportAttestationNavigatorStackParamList } from "~/components/RootNavigator/types/PassportAttestationNavigator";
import HeaderCloseButton from "LLM/components/Navigation/HeaderCloseButton";
import LandingScreen from "./screens/Landing";
import ScanMRZScreen from "./screens/ScanMRZ";
import ReadNFCScreen from "./screens/ReadNFC";
import ConfirmScreen from "./screens/Confirm";
import SelectProofScreen from "./screens/SelectProof";
import GenerateProofScreen from "./screens/GenerateProof";
import SuccessScreen from "./screens/Success";

const Stack = createNativeStackNavigator<PassportAttestationNavigatorStackParamList>();

function closePassportAttestationFlow(
  navigation: NativeStackNavigationProp<
    PassportAttestationNavigatorStackParamList,
    keyof PassportAttestationNavigatorStackParamList
  >,
) {
  const parentNavigation = navigation.getParent();

  if (parentNavigation?.canGoBack()) {
    parentNavigation.goBack();
    return;
  }

  navigation.popToTop();
}

function getFlowStepHeaderOptions(
  navigation: NativeStackNavigationProp<
    PassportAttestationNavigatorStackParamList,
    keyof PassportAttestationNavigatorStackParamList
  >,
): NativeStackNavigationOptions {
  return {
    title: "",
    headerTitle: () => null,
    headerRight: () => (
      <HeaderCloseButton onClose={() => closePassportAttestationFlow(navigation)} />
    ),
  };
}

export default function PassportAttestationNavigator() {
  const { colors } = useTheme();
  const stackNavConfig = useMemo(() => getStackNavigatorConfig(colors), [colors]);

  return (
    <Stack.Navigator screenOptions={stackNavConfig}>
      <Stack.Screen
        name={ScreenName.PassportAttestationLanding}
        component={LandingScreen}
        options={({ navigation }) => getFlowStepHeaderOptions(navigation)}
      />
      <Stack.Screen
        name={ScreenName.PassportAttestationScanMRZ}
        component={ScanMRZScreen}
        options={({ navigation }) => getFlowStepHeaderOptions(navigation)}
      />
      <Stack.Screen
        name={ScreenName.PassportAttestationReadNFC}
        component={ReadNFCScreen}
        options={({ navigation }) => getFlowStepHeaderOptions(navigation)}
      />
      <Stack.Screen
        name={ScreenName.PassportAttestationConfirm}
        component={ConfirmScreen}
        options={({ navigation }) => getFlowStepHeaderOptions(navigation)}
      />
      <Stack.Screen
        name={ScreenName.PassportAttestationSelectProof}
        component={SelectProofScreen}
        options={({ navigation }) => getFlowStepHeaderOptions(navigation)}
      />
      <Stack.Screen
        name={ScreenName.PassportAttestationGenerateProof}
        component={GenerateProofScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={ScreenName.PassportAttestationSuccess}
        component={SuccessScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
