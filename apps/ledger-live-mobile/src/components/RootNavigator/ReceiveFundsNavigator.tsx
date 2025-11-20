import React, { useCallback, useMemo } from "react";
import { Platform } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTheme } from "styled-components/native";
import { useTranslation } from "react-i18next";
import { NavigationProp, useRoute } from "@react-navigation/native";
import { ScreenName } from "~/const";
import ReceiveConfirmation from "~/screens/ReceiveFunds/03-Confirmation";
import ReceiveConnectDevice, {
  connectDeviceHeaderOptions,
} from "~/screens/ReceiveFunds/03a-ConnectDevice";
import ReceiveVerifyAddress from "~/screens/ReceiveFunds/03b-VerifyAddress";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import StepHeader from "../StepHeader";
import { NavigationHeaderCloseButtonAdvanced } from "../NavigationHeaderCloseButton";
import { track } from "~/analytics";
import { ReceiveFundsStackParamList } from "./types/ReceiveFundsNavigator";
import { NavigationHeaderBackButton } from "../NavigationHeaderBackButton";
import { Flex } from "@ledgerhq/native-ui";
import HelpButton from "~/screens/ReceiveFunds/HelpButton";
import { useSelector, useDispatch } from "react-redux";
import { hasClosedWithdrawBannerSelector, isOnboardingFlowSelector } from "~/reducers/settings";
import { urls } from "~/utils/urls";
import ReceiveProvider from "~/screens/ReceiveFunds/01b-ReceiveProvider.";
import { setIsOnboardingFlowReceiveSuccess } from "~/actions/settings";
import { useLocalizedUrl } from "LLM/hooks/useLocalizedUrls";

export default function ReceiveFundsNavigator() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const route = useRoute();
  const hasClosedWithdrawBanner = useSelector(hasClosedWithdrawBannerSelector);
  const isOnboardingFlow = useSelector(isOnboardingFlowSelector);
  const dispatchRedux = useDispatch();
  const localizedWithdrawCryptoUrl = useLocalizedUrl(urls.withdrawCrypto);

  const onClose = useCallback(() => {
    track("button_clicked", {
      button: "Close",
      screen: route.name,
    });
  }, [route]);

  const stackNavigationConfig = useMemo(
    () => ({
      ...getStackNavigatorConfig(colors, true),
      headerRight: () => (
        <NavigationHeaderCloseButtonAdvanced
          onClose={onClose}
          disablePostOnboardingRedirect={isOnboardingFlow}
        />
      ),
    }),
    [colors, onClose, isOnboardingFlow],
  );

  const onConnectDeviceBack = useCallback((navigation: NavigationProp<Record<string, unknown>>) => {
    track("button_clicked", {
      button: "Back arrow",
      page: ScreenName.ReceiveConnectDevice,
    });
    navigation.goBack();
  }, []);

  const onConfirmationClose = useCallback(() => {
    track("button_clicked", {
      button: "HeaderRight Close",
      page: ScreenName.ReceiveConfirmation,
    });

    dispatchRedux(setIsOnboardingFlowReceiveSuccess(true));
  }, [dispatchRedux]);

  const onVerificationConfirmationClose = useCallback(() => {
    track("button_clicked", {
      button: "HeaderRight Close",
      page: "ReceiveVerificationConfirmation",
    });
  }, []);

  return (
    <Stack.Navigator
      screenOptions={{
        ...stackNavigationConfig,
        gestureEnabled: Platform.OS === "ios",
      }}
    >
      <Stack.Screen
        name={ScreenName.ReceiveProvider}
        component={ReceiveProvider}
        options={{
          header: undefined,
        }}
      />

      {/* Select / Connect Device */}
      <Stack.Screen
        name={ScreenName.ReceiveConnectDevice}
        component={ReceiveConnectDevice}
        options={({ navigation }) => ({
          headerTitle: () => (
            <StepHeader
              subtitle={t("transfer.receive.stepperHeader.range", {
                currentStep: "2",
                totalSteps: 3,
              })}
              title={t("transfer.receive.stepperHeader.connectDevice")}
            />
          ),
          ...connectDeviceHeaderOptions(() => onConnectDeviceBack(navigation)),
        })}
      />
      {/* Select / Connect Device */}
      <Stack.Screen
        name={ScreenName.ReceiveVerifyAddress}
        component={ReceiveVerifyAddress}
        options={{
          headerTitle: "",
          headerLeft: () => null,
        }}
      />
      {/* Add account(s) automatically */}
      {/* Receive Address */}
      <Stack.Screen
        name={ScreenName.ReceiveConfirmation}
        component={ReceiveConfirmation}
        options={({ route }) => ({
          // Nice to know: headerTitle is manually set in a useEffect of ReceiveConfirmation
          headerTitle: "",
          header: undefined,
          headerLeft: () => (route.params?.hideBackButton ? null : <NavigationHeaderBackButton />),
          headerRight: () => (
            <Flex alignItems="center" justifyContent="center" flexDirection="row">
              {hasClosedWithdrawBanner && (
                <HelpButton
                  url={localizedWithdrawCryptoUrl}
                  eventButton="How to withdraw from exchange"
                />
              )}
              <NavigationHeaderCloseButtonAdvanced
                onClose={
                  route.params.verified ? onVerificationConfirmationClose : onConfirmationClose
                }
                disablePostOnboardingRedirect={isOnboardingFlow}
                popToTop={isOnboardingFlow}
              />
            </Flex>
          ),
        })}
      />
    </Stack.Navigator>
  );
}

const Stack = createNativeStackNavigator<ReceiveFundsStackParamList>();
