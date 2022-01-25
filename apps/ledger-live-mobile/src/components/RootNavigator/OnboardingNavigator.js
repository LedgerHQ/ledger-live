// @flow
import React, { useMemo } from "react";
import {
  createStackNavigator,
  CardStyleInterpolators,
} from "@react-navigation/stack";
import { useTheme } from "@react-navigation/native";
import { ScreenName, NavigatorName } from "../../const";
import PasswordAddFlowNavigator from "./PasswordAddFlowNavigator";

import OnboardingWelcome from "../../screens/Onboarding/steps/welcome";
import OnboardingLanguage from "../../screens/Onboarding/steps/language";
import OnboardingTerms from "../../screens/Onboarding/steps/terms";
import OnboardingDeviceSelection from "../../screens/Onboarding/steps/deviceSelection";
import OnboardingUseCase from "../../screens/Onboarding/steps/useCaseSelection";
import OnboardingNewDeviceInfo from "../../screens/Onboarding/steps/newDeviceInfo";
import OnboardingNewDevice from "../../screens/Onboarding/steps/setupDevice";
import OnboardingRecoveryPhrase from "../../screens/Onboarding/steps/recoveryPhrase";
import OnboardingInfoModal from "../OnboardingStepperView/OnboardingInfoModal";

import OnboardingPairNew from "../../screens/Onboarding/steps/pairNew";
import OnboardingImportAccounts from "../../screens/Onboarding/steps/importAccounts";
import OnboardingFinish from "../../screens/Onboarding/steps/finish";
import OnboardingQuiz from "../../screens/Onboarding/OnboardingQuiz";
import OnboardingQuizFinal from "../../screens/Onboarding/OnboardingQuizFinal";

import { getStackNavigatorConfig } from "../../navigation/navigatorConfig";
import styles from "../../navigation/styles";

export default function OnboardingNavigator() {
  const { colors } = useTheme();
  const stackNavigationConfig = useMemo(
    () => getStackNavigatorConfig(colors, true),
    [colors],
  );
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name={ScreenName.OnboardingWelcome}
        component={OnboardingWelcome}
      />
      <Stack.Screen
        name={ScreenName.OnboardingLanguage}
        component={OnboardingLanguage}
        options={{
          headerShown: true,
          ...stackNavigationConfig,
          title: null,
          headerRight: null,
          headerStyle: styles.headerNoShadow,
        }}
      />
      <Stack.Screen
        name={ScreenName.OnboardingTermsOfUse}
        component={OnboardingTerms}
      />
      <Stack.Screen
        name={ScreenName.OnboardingDeviceSelection}
        component={OnboardingDeviceSelection}
      />
      <Stack.Screen
        name={ScreenName.OnboardingUseCase}
        component={OnboardingUseCase}
      />
      <Stack.Screen
        name={ScreenName.OnboardingSetNewDeviceInfo}
        component={OnboardingNewDeviceInfo}
      />

      <Stack.Screen
        name={ScreenName.OnboardingSetNewDevice}
        component={OnboardingNewDevice}
      />

      <Stack.Screen
        name={ScreenName.OnboardingRecoveryPhrase}
        component={OnboardingRecoveryPhrase}
      />

      <Stack.Screen
        name={ScreenName.OnboardingInfoModal}
        component={OnboardingInfoModal}
        options={{
          cardStyleInterpolator: CardStyleInterpolators.forVerticalIOS,
        }}
      />

      <Stack.Screen
        name={ScreenName.OnboardingPairNew}
        component={OnboardingPairNew}
      />

      <Stack.Screen
        name={ScreenName.OnboardingImportAccounts}
        component={OnboardingImportAccounts}
      />

      <Stack.Screen
        name={ScreenName.OnboardingFinish}
        component={OnboardingFinish}
      />

      <Stack.Screen
        name={NavigatorName.PasswordAddFlow}
        component={PasswordAddFlowNavigator}
      />

      <Stack.Screen
        name={ScreenName.OnboardingQuiz}
        component={OnboardingQuiz}
      />

      <Stack.Screen
        name={ScreenName.OnboardingQuizFinal}
        component={OnboardingQuizFinal}
      />
    </Stack.Navigator>
  );
}

const Stack = createStackNavigator();
