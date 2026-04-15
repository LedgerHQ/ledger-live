import React, { useMemo } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
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

export default function PassportAttestationNavigator() {
  const { colors } = useTheme();
  const stackNavConfig = useMemo(() => getStackNavigatorConfig(colors), [colors]);

  return (
    <Stack.Navigator screenOptions={stackNavConfig}>
      <Stack.Screen
        name={ScreenName.PassportAttestationLanding}
        component={LandingScreen}
        options={{ title: "Generate a ZK proof of your ID" }}
      />
      <Stack.Screen
        name={ScreenName.PassportAttestationScanMRZ}
        component={ScanMRZScreen}
        options={{ title: "Scan passport" }}
      />
      <Stack.Screen
        name={ScreenName.PassportAttestationReadNFC}
        component={ReadNFCScreen}
        options={{ title: "Reading Passport", headerBackVisible: false }}
      />
      <Stack.Screen
        name={ScreenName.PassportAttestationConfirm}
        component={ConfirmScreen}
        options={{ title: "Passport informations" }}
      />
      <Stack.Screen
        name={ScreenName.PassportAttestationSelectProof}
        component={SelectProofScreen}
        options={({ navigation }) => ({
          title: "",
          headerLeft: () => null,
          headerTitle: () => null,
          headerRight: () => (
            <HeaderCloseButton
              onClose={() => {
                const parentNavigation = navigation.getParent();

                if (parentNavigation?.canGoBack()) {
                  parentNavigation.goBack();
                  return;
                }

                navigation.popToTop();
              }}
            />
          ),
        })}
      />
      <Stack.Screen
        name={ScreenName.PassportAttestationGenerateProof}
        component={GenerateProofScreen}
        options={({ navigation }) => ({
          title: "",
          headerLeft: () => null,
          headerTitle: () => null,
          headerRight: () => (
            <HeaderCloseButton
              onClose={() => {
                const parentNavigation = navigation.getParent();

                if (parentNavigation?.canGoBack()) {
                  parentNavigation.goBack();
                  return;
                }

                navigation.popToTop();
              }}
            />
          ),
        })}
      />
      <Stack.Screen
        name={ScreenName.PassportAttestationSuccess}
        component={SuccessScreen}
        options={{ title: "", headerLeft: () => null, headerRight: () => null }}
      />
    </Stack.Navigator>
  );
}
