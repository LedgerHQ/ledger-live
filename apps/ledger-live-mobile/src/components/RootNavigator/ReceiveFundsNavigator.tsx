import React, { useCallback, useMemo } from "react";
import { Platform } from "react-native";
import { createStackNavigator } from "@react-navigation/stack";
import { useTheme } from "styled-components/native";
import { useTranslation } from "react-i18next";
import { NavigationProp, useRoute } from "@react-navigation/native";
import { ScreenName } from "~/const";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import StepHeader from "../StepHeader";
import { NavigationHeaderCloseButtonAdvanced } from "../NavigationHeaderCloseButton";
import { track } from "~/analytics";
import { ReceiveFundsStackParamList } from "./types/ReceiveFundsNavigator";
import { NavigationHeaderBackButton } from "../NavigationHeaderBackButton";
import { Flex } from "@ledgerhq/native-ui";
import HelpButton from "~/screens/ReceiveFunds/HelpButton";
import { useSelector } from "react-redux";
import {
  hasClosedNetworkBannerSelector,
  hasClosedWithdrawBannerSelector,
  isOnboardingFlowSelector,
} from "~/reducers/settings";
import { urls } from "~/utils/urls";
import ReceiveProvider from "~/screens/ReceiveFunds/01b-ReceiveProvider.";
import { useReceiveNoahEntry } from "~/hooks/useNoahEntryPoint";
import { connectDeviceHeaderOptions } from "~/screens/ReceiveFunds/03a-ConnectDevice";
import { addAccountsSelectDeviceHeaderOptions } from "~/screens/ReceiveFunds/02-AddAccountSelectDevice";
import { register } from "react-native-bundle-splitter";

const ReceiveConfirmation = register({
  loader: () => import("~/screens/ReceiveFunds/03-Confirmation"),
});
const ReceiveConnectDevice = register({
  loader: () => import("~/screens/ReceiveFunds/03a-ConnectDevice"),
});
const ReceiveVerifyAddress = register({
  loader: () => import("~/screens/ReceiveFunds/03b-VerifyAddress"),
});
const ReceiveSelectCrypto = register({
  loader: () => import("~/screens/ReceiveFunds/01-SelectCrypto"),
});
const ReceiveSelectNetwork = register({
  loader: () => import("~/screens/ReceiveFunds/02-SelectNetwork"),
});
const ReceiveAddAccountSelectDevice = register({
  loader: () => import("~/screens/ReceiveFunds/02-AddAccountSelectDevice"),
});
const ReceiveSelectAccount = register({
  loader: () => import("~/screens/ReceiveFunds/02-SelectAccount"),
});
const ReceiveAddAccount = register({
  loader: () => import("~/screens/ReceiveFunds/02-AddAccount"),
});

export default function ReceiveFundsNavigator() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const route = useRoute();
  const hasClosedWithdrawBanner = useSelector(hasClosedWithdrawBannerSelector);
  const hasClosedNetworkBanner = useSelector(hasClosedNetworkBannerSelector);
  const isOnboardingFlow = useSelector(isOnboardingFlowSelector);
  const receiveNoahEntry = useReceiveNoahEntry();

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
          isOnboardingFlow={isOnboardingFlow}
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
  }, []);

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
          headerLeft: () => <NavigationHeaderBackButton />,
          headerTitle: "",
          headerRight: () => <NavigationHeaderCloseButtonAdvanced onClose={onClose} />,
        }}
      />

      {/* Select Crypto (see : apps/ledger-live-mobile/src/screens/AddAccounts/01-SelectCrypto.js) */}
      <Stack.Screen
        name={ScreenName.ReceiveSelectCrypto}
        component={ReceiveSelectCrypto}
        options={{
          headerLeft: () => <NavigationHeaderBackButton />,
          headerTitle: "",
          headerRight: () => (
            <NavigationHeaderCloseButtonAdvanced
              onClose={onClose}
              isOnboardingFlow={isOnboardingFlow}
            />
          ),
        }}
        {...receiveNoahEntry}
      />

      <Stack.Screen
        name={ScreenName.DepositSelectNetwork}
        component={ReceiveSelectNetwork}
        options={{
          headerLeft: () => <NavigationHeaderBackButton />,
          headerTitle: "",
          headerRight: () => (
            <Flex alignItems="center" justifyContent="center" flexDirection="row">
              {hasClosedNetworkBanner && (
                <HelpButton eventButton="Choose a network article" url={urls.chooseNetwork} />
              )}
              <NavigationHeaderCloseButtonAdvanced
                onClose={onClose}
                isOnboardingFlow={isOnboardingFlow}
              />
            </Flex>
          ),
        }}
      />

      {/* Select Account */}
      <Stack.Screen
        name={ScreenName.ReceiveSelectAccount}
        component={ReceiveSelectAccount}
        options={{
          headerTitle: "",
        }}
        {...receiveNoahEntry}
      />

      {/* Select Account */}
      <Stack.Screen
        name={ScreenName.ReceiveAddAccountSelectDevice}
        component={ReceiveAddAccountSelectDevice}
        options={{
          headerTitle: () => (
            <StepHeader
              subtitle={t("transfer.receive.stepperHeader.range", {
                currentStep: "2",
                totalSteps: 3,
              })}
              title={t("transfer.receive.stepperHeader.connectDevice")}
            />
          ),
          ...addAccountsSelectDeviceHeaderOptions(onClose, isOnboardingFlow),
        }}
      />

      {/* Select Account */}
      <Stack.Screen
        name={ScreenName.ReceiveAddAccount}
        component={ReceiveAddAccount}
        options={{
          headerTitle: "",
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
          headerLeft: () => <NavigationHeaderBackButton />,
          headerRight: () => (
            <Flex alignItems="center" justifyContent="center" flexDirection="row">
              {hasClosedWithdrawBanner && (
                <HelpButton url={urls.withdrawCrypto} eventButton="How to withdraw from exchange" />
              )}
              <NavigationHeaderCloseButtonAdvanced
                onClose={
                  route.params.verified ? onVerificationConfirmationClose : onConfirmationClose
                }
                isOnboardingFlow={isOnboardingFlow}
                popToTop={isOnboardingFlow}
              />
            </Flex>
          ),
        })}
      />
    </Stack.Navigator>
  );
}

const Stack = createStackNavigator<ReceiveFundsStackParamList>();
