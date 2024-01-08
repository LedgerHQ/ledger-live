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
import { ScreenName, NavigatorName } from "~/const";
import PasswordAddFlowNavigator from "./PasswordAddFlowNavigator";
import OnboardingWelcome from "~/screens/Onboarding/steps/welcome";
import OnboardingLanguage from "~/screens/Onboarding/steps/language";
import OnboardingTerms from "~/screens/Onboarding/steps/terms";
import OnboardingDeviceSelection from "~/screens/Onboarding/steps/deviceSelection";
import OnboardingUseCase from "~/screens/Onboarding/steps/useCaseSelection";
import OnboardingNewDeviceInfo from "~/screens/Onboarding/steps/newDeviceInfo";
import OnboardingNewDiscoverLiveInfo from "~/screens/Onboarding/steps/discoverLiveInfo";
import OnboardingNewDevice from "~/screens/Onboarding/steps/setupDevice";
import OnboardingRecoveryPhrase from "~/screens/Onboarding/steps/recoveryPhrase";
import OnboardingInfoModal from "../OnboardingStepperView/OnboardingInfoModal";

import OnboardingBleDevicePairingFlow from "~/screens/Onboarding/steps/BleDevicePairingFlow";
import OnboardingPairNew from "~/screens/Onboarding/steps/pairNew";
import OnboardingImportAccounts from "~/screens/Onboarding/steps/importAccounts";
import OnboardingPreQuizModal from "~/screens/Onboarding/steps/setupDevice/drawers/OnboardingPreQuizModal";
import OnboardingQuiz from "~/screens/Onboarding/OnboardingQuiz";
import OnboardingQuizFinal from "~/screens/Onboarding/OnboardingQuizFinal";
import NavigationHeader from "../NavigationHeader";
import NavigationOverlay from "../NavigationOverlay";
import NavigationModalContainer from "../NavigationModalContainer";
import OnboardingSetupDeviceInformation from "~/screens/Onboarding/steps/setupDevice/drawers/SecurePinCode";
import OnboardingSetupDeviceRecoveryPhrase from "~/screens/Onboarding/steps/setupDevice/drawers/SecureRecoveryPhrase";
import OnboardingGeneralInformation from "~/screens/Onboarding/steps/setupDevice/drawers/GeneralInformation";
import OnboardingBluetoothInformation from "~/screens/Onboarding/steps/setupDevice/drawers/BluetoothConnection";
import PostWelcomeSelection from "~/screens/Onboarding/steps/postWelcomeSelection";
import GetDeviceScreen from "~/screens/GetDeviceScreen";
import OnboardingProtectFlow from "~/screens/Onboarding/steps/protectFlow";

import {
  OnboardingNavigatorParamList,
  OnboardingPreQuizModalNavigatorParamList,
} from "./types/OnboardingNavigator";
import { StackNavigatorProps } from "./types/helpers";
import ProtectConnectionInformationModal from "~/screens/Onboarding/steps/setupDevice/drawers/ProtectConnectionInformationModal";
import { NavigationHeaderBackButton } from "../NavigationHeaderBackButton";
import AccessExistingWallet from "~/screens/Onboarding/steps/accessExistingWallet";

const Stack = createStackNavigator<OnboardingNavigatorParamList>();
const OnboardingPreQuizModalStack =
  createStackNavigator<OnboardingPreQuizModalNavigatorParamList>();

function OnboardingPreQuizModalNavigator(
  props: StackNavigatorProps<OnboardingNavigatorParamList, NavigatorName.OnboardingPreQuiz>,
) {
  const options: Partial<StackNavigationOptions> = {
    header: props => (
      // TODO: Replace this value with constant.purple as soon as the value is fixed in the theme
      <Flex bg="constant.purple">
        <NavigationHeader {...props} hideBack containerProps={{ backgroundColor: "transparent" }} />
      </Flex>
    ),
    headerStyle: {},
    headerShadowVisible: false,
  };

  return (
    <NavigationModalContainer {...props} backgroundColor="constant.purple">
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

const infoModalOptions = ({ theme }: { theme: Theme }): Partial<StackNavigationOptions> => ({
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
        headerStyle: { backgroundColor: theme.colors.background.main },
        cardStyle: { backgroundColor: theme.colors.background.main },
      }}
    >
      <Stack.Screen name={ScreenName.OnboardingWelcome} component={OnboardingWelcome} />
      <Stack.Screen
        name={ScreenName.OnboardingPostWelcomeSelection}
        component={PostWelcomeSelection}
        options={{
          headerShown: true,
          headerLeft: () => <NavigationHeaderBackButton />,
        }}
      />
      <Stack.Screen
        name={ScreenName.OnboardingWelcomeBack}
        component={AccessExistingWallet}
        options={{
          headerShown: true,
          headerLeft: () => <NavigationHeaderBackButton />,
        }}
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
      <Stack.Screen name={ScreenName.OnboardingTermsOfUse} component={OnboardingTerms} />
      <Stack.Screen
        name={ScreenName.OnboardingDeviceSelection}
        component={OnboardingDeviceSelection}
        options={{
          headerShown: true,
          headerLeft: () => <NavigationHeaderBackButton />,
        }}
      />
      <Stack.Screen
        name={ScreenName.OnboardingBleDevicePairingFlow}
        component={OnboardingBleDevicePairingFlow}
        options={{
          headerShown: true,
          headerLeft: () => <NavigationHeaderBackButton />,
        }}
      />
      <Stack.Screen
        name={ScreenName.OnboardingUseCase}
        component={OnboardingUseCase}
        options={{
          headerShown: true,
          headerLeft: () => <NavigationHeaderBackButton />,
        }}
      />
      <Stack.Screen
        name={NavigatorName.OnboardingPreQuiz}
        component={OnboardingPreQuizModalNavigator}
        options={modalOptions}
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
      <Stack.Screen name={ScreenName.OnboardingSetNewDevice} component={OnboardingNewDevice} />

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

      <Stack.Screen name={ScreenName.OnboardingPairNew} component={OnboardingPairNew} />

      <Stack.Screen name={ScreenName.OnboardingProtectFlow} component={OnboardingProtectFlow} />

      <Stack.Screen
        name={ScreenName.OnboardingImportAccounts}
        component={OnboardingImportAccounts}
      />

      <Stack.Screen name={NavigatorName.PasswordAddFlow} component={PasswordAddFlowNavigator} />

      <Stack.Screen name={ScreenName.OnboardingQuiz} component={OnboardingQuiz} />

      <Stack.Screen name={ScreenName.OnboardingQuizFinal} component={OnboardingQuizFinal} />
    </Stack.Navigator>
  );
}
