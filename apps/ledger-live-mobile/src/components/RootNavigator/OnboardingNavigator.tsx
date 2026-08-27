import React from "react";
import {
  createNativeStackNavigator,
  NativeStackNavigationOptions,
} from "@react-navigation/native-stack";
import { Flex } from "@ledgerhq/native-ui";
import { Theme } from "@ledgerhq/native-ui/styles/theme";

import { useTranslation } from "~/context/Locale";
import { useTheme } from "styled-components/native";
import { ScreenName, NavigatorName } from "~/const";
import OnboardingWelcome from "LLM/features/WelcomePage";
import NavigationHeader from "../NavigationHeader";
import NavigationModalContainer from "../NavigationModalContainer";
import {
  OnboardingNavigatorParamList,
  OnboardingPreQuizModalNavigatorParamList,
} from "./types/OnboardingNavigator";
import { StackNavigatorProps } from "./types/helpers";
import { NavigationHeaderBackButton } from "../NavigationHeaderBackButton";
import { lazyScreen } from "./lazyScreen";

const Stack = createNativeStackNavigator<OnboardingNavigatorParamList>();
const OnboardingPreQuizModalStack =
  createNativeStackNavigator<OnboardingPreQuizModalNavigatorParamList>();

function OnboardingPreQuizModalNavigator(
  props: StackNavigatorProps<OnboardingNavigatorParamList, NavigatorName.OnboardingPreQuiz>,
) {
  const options: Partial<NativeStackNavigationOptions> = {
    header: headerProps => (
      <Flex bg="constant.purple">
        <NavigationHeader
          {...headerProps}
          hideBack
          containerProps={{ backgroundColor: "transparent" }}
        />
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
          getComponent={lazyScreen(
            () =>
              require("~/screens/Onboarding/steps/setupDevice/drawers/OnboardingPreQuizModal") as typeof import("~/screens/Onboarding/steps/setupDevice/drawers/OnboardingPreQuizModal"),
          )}
          options={{ title: "", ...options }}
        />
      </OnboardingPreQuizModalStack.Navigator>
    </NavigationModalContainer>
  );
}

const modalOptions: Partial<NativeStackNavigationOptions> = {
  headerShown: false,
  animation: "slide_from_bottom",
};

const infoModalOptions = ({ theme }: { theme: Theme }): Partial<NativeStackNavigationOptions> => ({
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
      }}
    >
      <Stack.Screen name={ScreenName.OnboardingWelcome} component={OnboardingWelcome} />
      <Stack.Screen
        name={ScreenName.OnboardingPostWelcomeSelection}
        getComponent={lazyScreen(
          () =>
            require("~/screens/Onboarding/steps/postWelcomeSelection") as typeof import("~/screens/Onboarding/steps/postWelcomeSelection"),
        )}
        options={{
          headerShown: true,
          headerLeft: () => <NavigationHeaderBackButton />,
        }}
      />
      <Stack.Screen
        name={ScreenName.OnboardingNotificationsOptIn}
        getComponent={lazyScreen(
          () =>
            require("LLM/features/NotificationsOptIn") as typeof import("LLM/features/NotificationsOptIn"),
        )}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={ScreenName.OnboardingWelcomeBack}
        getComponent={lazyScreen(
          () =>
            require("~/screens/Onboarding/steps/accessExistingWallet") as typeof import("~/screens/Onboarding/steps/accessExistingWallet"),
        )}
        options={{
          headerShown: true,
          headerLeft: () => <NavigationHeaderBackButton />,
        }}
      />
      <Stack.Screen
        name={ScreenName.OnboardingLanguage}
        getComponent={lazyScreen(
          () =>
            require("~/screens/Onboarding/steps/language") as typeof import("~/screens/Onboarding/steps/language"),
        )}
        options={{
          ...infoModalOptions({ theme }),
          headerTitle: t("onboarding.stepLanguage.title"),
        }}
      />
      <Stack.Screen
        name={ScreenName.OnboardingTermsOfUse}
        getComponent={lazyScreen(
          () =>
            require("~/screens/Onboarding/steps/terms") as typeof import("~/screens/Onboarding/steps/terms"),
        )}
      />
      <Stack.Screen
        name={ScreenName.OnboardingDeviceSelection}
        getComponent={lazyScreen(
          () =>
            require("~/screens/Onboarding/steps/deviceSelection") as typeof import("~/screens/Onboarding/steps/deviceSelection"),
        )}
        options={{
          headerShown: true,
          headerLeft: () => <NavigationHeaderBackButton />,
        }}
      />
      <Stack.Screen
        name={ScreenName.OnboardingBleDevicePairingFlow}
        getComponent={lazyScreen(
          () =>
            require("~/screens/Onboarding/steps/BleDevicePairingFlow") as typeof import("~/screens/Onboarding/steps/BleDevicePairingFlow"),
        )}
        options={{
          headerShown: true,
          headerLeft: () => <NavigationHeaderBackButton />,
        }}
      />
      <Stack.Screen
        name={ScreenName.OnboardingUseCase}
        getComponent={lazyScreen(
          () =>
            require("~/screens/Onboarding/steps/useCaseSelection") as typeof import("~/screens/Onboarding/steps/useCaseSelection"),
        )}
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
        name={ScreenName.OnboardingModalSetupNewDevice}
        getComponent={lazyScreen(
          () =>
            require("~/screens/Onboarding/steps/newDeviceInfo") as typeof import("~/screens/Onboarding/steps/newDeviceInfo"),
        )}
      />
      <Stack.Screen
        name={ScreenName.OnboardingSetupDeviceInformation}
        getComponent={lazyScreen(
          () =>
            require("~/screens/Onboarding/steps/setupDevice/drawers/SecurePinCode") as typeof import("~/screens/Onboarding/steps/setupDevice/drawers/SecurePinCode"),
        )}
        options={infoModalOptions({ theme })}
      />
      <Stack.Screen
        name={ScreenName.OnboardingModalSetupSecureRecovery}
        getComponent={lazyScreen(
          () =>
            require("~/screens/Onboarding/steps/setupDevice/drawers/SecureRecoveryPhrase") as typeof import("~/screens/Onboarding/steps/setupDevice/drawers/SecureRecoveryPhrase"),
        )}
        options={infoModalOptions({ theme })}
      />
      <Stack.Screen
        name={ScreenName.OnboardingGeneralInformation}
        getComponent={lazyScreen(
          () =>
            require("~/screens/Onboarding/steps/setupDevice/drawers/GeneralInformation") as typeof import("~/screens/Onboarding/steps/setupDevice/drawers/GeneralInformation"),
        )}
        options={infoModalOptions({ theme })}
      />
      <Stack.Screen
        name={ScreenName.OnboardingBluetoothInformation}
        getComponent={lazyScreen(
          () =>
            require("~/screens/Onboarding/steps/setupDevice/drawers/BluetoothConnection") as typeof import("~/screens/Onboarding/steps/setupDevice/drawers/BluetoothConnection"),
        )}
        options={infoModalOptions({ theme })}
      />
      <Stack.Screen
        name={ScreenName.OnboardingProtectionConnectionInformation}
        getComponent={lazyScreen(
          () =>
            require("~/screens/Onboarding/steps/setupDevice/drawers/ProtectConnectionInformationModal") as typeof import("~/screens/Onboarding/steps/setupDevice/drawers/ProtectConnectionInformationModal"),
        )}
        options={infoModalOptions({ theme })}
      />
      <Stack.Screen
        name={ScreenName.OnboardingSetNewDevice}
        getComponent={lazyScreen(
          () =>
            require("~/screens/Onboarding/steps/setupDevice") as typeof import("~/screens/Onboarding/steps/setupDevice"),
        )}
      />
      <Stack.Screen
        name={ScreenName.OnboardingRecoveryPhrase}
        getComponent={lazyScreen(
          () =>
            require("~/screens/Onboarding/steps/recoveryPhrase") as typeof import("~/screens/Onboarding/steps/recoveryPhrase"),
        )}
      />
      <Stack.Screen
        name={ScreenName.OnboardingInfoModal}
        getComponent={lazyScreen(
          () =>
            require("../OnboardingStepperView/OnboardingInfoModal") as typeof import("../OnboardingStepperView/OnboardingInfoModal"),
        )}
        options={{ animation: "slide_from_bottom" }}
      />
      <Stack.Screen
        name={ScreenName.OnboardingPairNew}
        getComponent={lazyScreen(
          () =>
            require("~/screens/Onboarding/steps/PairNew") as typeof import("~/screens/Onboarding/steps/PairNew"),
        )}
      />
      <Stack.Screen
        name={ScreenName.OnboardingProtectFlow}
        getComponent={lazyScreen(
          () =>
            require("~/screens/Onboarding/steps/protectFlow") as typeof import("~/screens/Onboarding/steps/protectFlow"),
        )}
      />
      <Stack.Screen
        name={NavigatorName.PasswordAddFlow}
        getComponent={lazyScreen(
          () =>
            require("./PasswordAddFlowNavigator") as typeof import("./PasswordAddFlowNavigator"),
        )}
      />
      <Stack.Screen
        name={ScreenName.OnboardingQuiz}
        getComponent={lazyScreen(
          () =>
            require("~/screens/Onboarding/OnboardingQuiz") as typeof import("~/screens/Onboarding/OnboardingQuiz"),
        )}
      />
      <Stack.Screen
        name={ScreenName.OnboardingQuizFinal}
        getComponent={lazyScreen(
          () =>
            require("~/screens/Onboarding/OnboardingQuizFinal") as typeof import("~/screens/Onboarding/OnboardingQuizFinal"),
        )}
      />
      <Stack.Screen
        name={ScreenName.OnboardingSecureYourCrypto}
        getComponent={lazyScreen(
          () =>
            require("~/screens/Onboarding/OnboardingSecureYourCrypto") as typeof import("~/screens/Onboarding/OnboardingSecureYourCrypto"),
        )}
      />
      <Stack.Screen
        name={ScreenName.OnboardingFundSuccess}
        getComponent={lazyScreen(
          () =>
            require("~/screens/Onboarding/OnboardingFundSuccess") as typeof import("~/screens/Onboarding/OnboardingFundSuccess"),
        )}
      />
      <Stack.Screen
        name={NavigatorName.AnalyticsOptInPrompt}
        options={{ headerShown: false }}
        getComponent={lazyScreen(
          () =>
            require("./AnalyticsOptInPromptNavigator") as typeof import("./AnalyticsOptInPromptNavigator"),
        )}
      />
      <Stack.Screen
        name={NavigatorName.LandingPages}
        getComponent={lazyScreen(
          () => require("./LandingPagesNavigator") as typeof import("./LandingPagesNavigator"),
        )}
      />
    </Stack.Navigator>
  );
}
