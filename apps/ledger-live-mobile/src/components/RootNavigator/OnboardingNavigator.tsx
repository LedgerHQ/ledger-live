import React from "react";
import {
  createStackNavigator,
  CardStyleInterpolators,
  TransitionPresets,
  StackNavigationOptions,
} from "@react-navigation/stack";
import { Flex } from "@ledgerhq/native-ui";
import { Theme } from "@ledgerhq/native-ui/styles/theme";

import { useTranslation } from "react-i18next";
import { useTheme } from "styled-components/native";
import { ScreenName, NavigatorName } from "../../const";
import PasswordAddFlowNavigator from "./PasswordAddFlowNavigator";
import OnboardingWelcome from "../../screens/Onboarding/steps/welcome";
import OnboardingLanguage from "../../screens/Onboarding/steps/language";
import OnboardingTerms from "../../screens/Onboarding/steps/terms";
import OnboardingDeviceSelection from "../../screens/Onboarding/steps/deviceSelection";
import OnboardingUseCase from "../../screens/Onboarding/steps/useCaseSelection";
import OnboardingNewDeviceInfo from "../../screens/Onboarding/steps/newDeviceInfo";
import OnboardingNewDiscoverLiveInfo from "../../screens/Onboarding/steps/discoverLiveInfo";
import OnboardingNewDevice from "../../screens/Onboarding/steps/setupDevice";
import OnboardingRecoveryPhrase from "../../screens/Onboarding/steps/recoveryPhrase";
import OnboardingInfoModal from "../OnboardingStepperView/OnboardingInfoModal";

import OnboardingPairNew from "../../screens/Onboarding/steps/pairNew";
import OnboardingImportAccounts from "../../screens/Onboarding/steps/importAccounts";
import OnboardingPreQuizModal from "../../screens/Onboarding/steps/setupDevice/drawers/OnboardingPreQuizModal";
import OnboardingQuiz from "../../screens/Onboarding/OnboardingQuiz";
import OnboardingQuizFinal from "../../screens/Onboarding/OnboardingQuizFinal";
import NavigationHeader from "../NavigationHeader";
import NavigationOverlay from "../NavigationOverlay";
import NavigationModalContainer from "../NavigationModalContainer";
import OnboardingSetupDeviceInformation from "../../screens/Onboarding/steps/setupDevice/drawers/SecurePinCode";
import OnboardingSetupDeviceRecoveryPhrase from "../../screens/Onboarding/steps/setupDevice/drawers/SecureRecoveryPhrase";
import OnboardingGeneralInformation from "../../screens/Onboarding/steps/setupDevice/drawers/GeneralInformation";
import OnboardingBluetoothInformation from "../../screens/Onboarding/steps/setupDevice/drawers/BluetoothConnection";
import OnboardingWarning from "../../screens/Onboarding/steps/setupDevice/drawers/Warning";
import OnboardingSyncDesktopInformation from "../../screens/Onboarding/steps/setupDevice/drawers/SyncDesktopInformation";
import OnboardingRecoveryPhraseWarning from "../../screens/Onboarding/steps/setupDevice/drawers/RecoveryPhraseWarning";
import PostWelcomeSelection from "../../screens/Onboarding/steps/postWelcomeSelection";
import GetDeviceScreen from "../../screens/GetDeviceScreen";
import OnboardingStepDoYouHaveALedgerDevice from "../../screens/Onboarding/steps/doYouHaveALedger";
import OnboardingProtectFlow from "../../screens/Onboarding/steps/protectFlow";

import {
  OnboardingCarefulWarningParamList,
  OnboardingNavigatorParamList,
  OnboardingPreQuizModalNavigatorParamList,
} from "./types/OnboardingNavigator";
import { StackNavigatorProps } from "./types/helpers";
import ProtectConnectionInformationModal from "../../screens/Onboarding/steps/setupDevice/drawers/ProtectConnectionInformationModal";

const Stack = createStackNavigator<OnboardingNavigatorParamList>();
const OnboardingCarefulWarningStack =
  createStackNavigator<OnboardingCarefulWarningParamList>();
const OnboardingPreQuizModalStack =
  createStackNavigator<OnboardingPreQuizModalNavigatorParamList>();

function OnboardingCarefulWarning(
  props: StackNavigatorProps<
    OnboardingNavigatorParamList,
    NavigatorName.OnboardingCarefulWarning
  >,
) {
  const options: Partial<StackNavigationOptions> = {
    header: props => (
      // TODO: Replace this value with constant.purple as soon as the value is fixed in the theme
      <Flex backgroundColor="background.main">
        <NavigationHeader
          {...props}
          hideBack
          containerProps={{ backgroundColor: "transparent" }}
        />
      </Flex>
    ),
    headerStyle: { backgroundColor: "transparent" },
  };

  return (
    <NavigationModalContainer
      {...props}
      deadZoneProps={{ flex: 1 }}
      contentContainerProps={{
        maxHeight: "70%",
        flexDirection: "row",
      }}
      backgroundColor="background.main"
    >
      <OnboardingCarefulWarningStack.Navigator>
        <OnboardingCarefulWarningStack.Screen
          name={ScreenName.OnboardingModalWarning}
          component={OnboardingWarning}
          options={{ title: "", ...options }}
          // initialParams={props.route.params}
        />
        <OnboardingCarefulWarningStack.Screen
          name={ScreenName.OnboardingModalSyncDesktopInformation}
          component={OnboardingSyncDesktopInformation}
          options={{ title: "", ...options }}
          // initialParams={props.route.params}
        />
        <OnboardingCarefulWarningStack.Screen
          name={ScreenName.OnboardingModalRecoveryPhraseWarning}
          component={OnboardingRecoveryPhraseWarning}
          options={{ title: "", ...options }}
          // initialParams={props.route.params}
        />
      </OnboardingCarefulWarningStack.Navigator>
    </NavigationModalContainer>
  );
}

function OnboardingPreQuizModalNavigator(
  props: StackNavigatorProps<
    OnboardingNavigatorParamList,
    NavigatorName.OnboardingPreQuiz
  >,
) {
  const options: Partial<StackNavigationOptions> = {
    header: props => (
      // TODO: Replace this value with constant.purple as soon as the value is fixed in the theme
      <Flex bg="constant.purple">
        <NavigationHeader
          {...props}
          hideBack
          containerProps={{ backgroundColor: "transparent" }}
        />
      </Flex>
    ),
    headerStyle: {},
    headerShadowVisible: false,
  };

  return (
    <NavigationModalContainer
      {...props}
      backgroundColor="constant.purple"
      deadZoneProps={{ flex: 1 }}
      contentContainerProps={{ maxHeight: "55%" }}
    >
      <OnboardingPreQuizModalStack.Navigator>
        <OnboardingPreQuizModalStack.Screen
          name={ScreenName.OnboardingPreQuizModal}
          component={OnboardingPreQuizModal}
          options={{ title: "", ...options }}
          // initialParams={props.route.params}
        />
      </OnboardingPreQuizModalStack.Navigator>
    </NavigationModalContainer>
  );
}

const modalOptions: Partial<StackNavigationOptions> = {
  presentation: "transparentModal",
  cardOverlayEnabled: true,
  cardOverlay: () => <NavigationOverlay />,
  headerShown: false,
  ...TransitionPresets.ModalTransition,
};

const infoModalOptions = ({
  theme,
}: {
  theme: Theme;
}): Partial<StackNavigationOptions> => ({
  ...TransitionPresets.ModalTransition,
  headerStyle: {
    backgroundColor: theme.colors.background.drawer,
  },
  headerShown: true,
});

export default function OnboardingNavigator() {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        headerTitle: "",
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name={ScreenName.OnboardingWelcome}
        component={OnboardingWelcome}
      />
      <Stack.Screen
        name={ScreenName.OnboardingPostWelcomeSelection}
        component={PostWelcomeSelection}
      />
      <Stack.Screen
        name={ScreenName.GetDevice}
        component={GetDeviceScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={ScreenName.OnboardingLanguage}
        component={OnboardingLanguage}
        options={{
          ...infoModalOptions({ theme }),
          headerTitle: t("onboarding.stepLanguage.title"),
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
        name={NavigatorName.OnboardingCarefulWarning}
        component={OnboardingCarefulWarning}
        options={modalOptions}
      />
      <Stack.Screen
        name={NavigatorName.OnboardingPreQuiz}
        component={OnboardingPreQuizModalNavigator}
        options={modalOptions}
      />
      <Stack.Screen
        name={ScreenName.OnboardingDoYouHaveALedgerDevice}
        component={OnboardingStepDoYouHaveALedgerDevice}
      />
      <Stack.Screen
        name={ScreenName.OnboardingModalDiscoverLive}
        component={OnboardingNewDiscoverLiveInfo}
      />
      <Stack.Screen
        name={ScreenName.OnboardingModalSetupNewDevice}
        component={OnboardingNewDeviceInfo}
      />
      <Stack.Screen
        name={ScreenName.OnboardingSetupDeviceInformation}
        component={OnboardingSetupDeviceInformation}
        options={infoModalOptions({ theme })}
      />
      <Stack.Screen
        name={ScreenName.OnboardingModalSetupSecureRecovery}
        component={OnboardingSetupDeviceRecoveryPhrase}
        options={infoModalOptions({ theme })}
      />
      <Stack.Screen
        name={ScreenName.OnboardingGeneralInformation}
        component={OnboardingGeneralInformation}
        options={infoModalOptions({ theme })}
      />
      <Stack.Screen
        name={ScreenName.OnboardingBluetoothInformation}
        component={OnboardingBluetoothInformation}
        options={infoModalOptions({ theme })}
      />
      <Stack.Screen
        name={ScreenName.OnboardingProtectionConnectionInformation}
        component={ProtectConnectionInformationModal}
        options={infoModalOptions({ theme })}
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
        name={ScreenName.OnboardingProtectFlow}
        component={OnboardingProtectFlow}
      />

      <Stack.Screen
        name={ScreenName.OnboardingImportAccounts}
        component={OnboardingImportAccounts}
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
