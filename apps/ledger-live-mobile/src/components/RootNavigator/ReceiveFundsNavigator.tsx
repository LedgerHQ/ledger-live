import React, { useCallback, useMemo } from "react";
import { Platform } from "react-native";
import { createStackNavigator } from "@react-navigation/stack";
import { useTheme } from "styled-components/native";
import { useTranslation } from "react-i18next";
import { NavigationProp, useRoute } from "@react-navigation/native";
import { ScreenName } from "~/const";
import ReceiveConfirmation from "~/screens/ReceiveFunds/03-Confirmation";
import ReceiveConnectDevice, {
  connectDeviceHeaderOptions,
} from "~/screens/ReceiveFunds/03a-ConnectDevice";
import ReceiveVerifyAddress from "~/screens/ReceiveFunds/03b-VerifyAddress";
import ReceiveSelectCrypto from "~/screens/ReceiveFunds/01-SelectCrypto";
import ReceiveSelectNetwork from "~/screens/ReceiveFunds/02-SelectNetwork";
import ReceiveAddAccountSelectDevice, {
  addAccountsSelectDeviceHeaderOptions,
} from "~/screens/ReceiveFunds/02-AddAccountSelectDevice";
import ReceiveSelectAccount from "~/screens/ReceiveFunds/02-SelectAccount";
import ReceiveAddAccount from "~/screens/ReceiveFunds/02-AddAccount";

import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import StepHeader from "../StepHeader";
import { NavigationHeaderCloseButtonAdvanced } from "../NavigationHeaderCloseButton";
import { track } from "~/analytics";
import { ReceiveFundsStackParamList } from "./types/ReceiveFundsNavigator";
import { NavigationHeaderBackButton } from "../NavigationHeaderBackButton";
import { Flex } from "@ledgerhq/native-ui";
import HelpButton from "~/screens/ReceiveFunds/HelpButton";
import useFeature from "@ledgerhq/live-config/featureFlags/useFeature";
import { useSelector } from "react-redux";
import {
  hasClosedNetworkBannerSelector,
  hasClosedWithdrawBannerSelector,
} from "~/reducers/settings";

export default function ReceiveFundsNavigator() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const route = useRoute();
  const depositNetworkBannerMobile = useFeature("depositNetworkBannerMobile");
  const depositWithdrawBannerMobile = useFeature("depositWithdrawBannerMobile");
  const hasClosedWithdrawBanner = useSelector(hasClosedWithdrawBannerSelector);
  const hasClosedNetworkBanner = useSelector(hasClosedNetworkBannerSelector);

  const onClose = useCallback(() => {
    track("button_clicked", {
      button: "Close",
      screen: route.name,
    });
  }, [route]);

  const stackNavigationConfig = useMemo(
    () => ({
      ...getStackNavigatorConfig(colors, true),
      headerRight: () => <NavigationHeaderCloseButtonAdvanced onClose={onClose} />,
    }),
    [colors, onClose],
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
      {/* Select Crypto (see : apps/ledger-live-mobile/src/screens/AddAccounts/01-SelectCrypto.js) */}
      <Stack.Screen
        name={ScreenName.ReceiveSelectCrypto}
        component={ReceiveSelectCrypto}
        options={{
          headerLeft: () => <NavigationHeaderBackButton />,
          headerTitle: "",
          headerRight: () => <NavigationHeaderCloseButtonAdvanced onClose={onClose} />,
        }}
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
                <HelpButton
                  eventButton="Choose a network article"
                  url={depositNetworkBannerMobile?.params?.url || ""}
                  enabled={depositNetworkBannerMobile?.enabled ?? false}
                />
              )}
              <NavigationHeaderCloseButtonAdvanced onClose={onClose} />
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
          ...addAccountsSelectDeviceHeaderOptions(onClose),
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
                <HelpButton
                  url={depositWithdrawBannerMobile?.params?.url || ""}
                  enabled={depositWithdrawBannerMobile?.enabled ?? false}
                  eventButton="How to withdraw from exchange"
                />
              )}
              <NavigationHeaderCloseButtonAdvanced
                onClose={
                  route.params.verified ? onVerificationConfirmationClose : onConfirmationClose
                }
              />
            </Flex>
          ),
        })}
      />
    </Stack.Navigator>
  );
}

const Stack = createStackNavigator<ReceiveFundsStackParamList>();
