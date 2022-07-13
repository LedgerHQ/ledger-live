// @flow
import React, { useCallback, useMemo } from "react";
import { Platform } from "react-native";
import { createStackNavigator } from "@react-navigation/stack";
import { useTheme } from "styled-components/native";
import { useTranslation } from "react-i18next";
import { HeaderBackButton } from "@react-navigation/elements";
import { ScreenName } from "../../const";
import ReceiveConfirmation from "../../screens/ReceiveFunds/03-Confirmation";
import ReceiveConnectDevice from "../../screens/ReceiveFunds/03a-ConnectDevice";
import ReceiveVerifyAddress from "../../screens/ReceiveFunds/03b-VerifyAddress";
import ReceiveSelectCrypto from "../../screens/ReceiveFunds/01-SelectCrypto";

import ReceiveAddAccountSelectDevice from "../../screens/ReceiveFunds/02-AddAccountSelectDevice";
import ReceiveSelectAccount from "../../screens/ReceiveFunds/02-SelectAccount";
import ReceiveAddAccount from "../../screens/ReceiveFunds/02-AddAccount";

import { getStackNavigatorConfig } from "../../navigation/navigatorConfig";
import StepHeader from "../StepHeader";
import HeaderRightClose from "../HeaderRightClose";
import { track } from "../../analytics";

export default function ReceiveFundsNavigator() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const stackNavigationConfig = useMemo(
    () => getStackNavigatorConfig(colors, true),
    [colors],
  );

  const onSelectCryptoClose = useCallback(() => {
    track("button_clicked", {
      button: "Close 'x'",
      screen: ScreenName.ReceiveSelectCrypto,
    });
  }, []);

  const onSelectAccountClose = useCallback(() => {
    track("button_clicked", {
      button: "Close 'x'",
      screen: ScreenName.ReceiveSelectAccount,
    });
  }, []);

  const onConnectDeviceClose = useCallback(() => {
    track("button_clicked", {
      button: "Close 'x'",
      screen: ScreenName.ReceiveConnectDevice,
    });
  }, []);

  const onConnectDeviceBack = useCallback(() => {
    track("button_clicked", {
      button: "Back arrow",
      screen: ScreenName.ReceiveConnectDevice,
    });
  }, []);

  const onVerifyAddressClose = useCallback(() => {
    track("button_clicked", {
      button: "Close 'x'",
      screen: ScreenName.ReceiveVerifyAddress,
    });
  }, []);

  const onConfirmationClose = useCallback(() => {
    track("button_clicked", {
      button: "Close 'x'",
      screen: ScreenName.ReceiveConfirmation,
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
          headerLeft: null,
          headerTitle: "",
          headerRight: <HeaderRightClose onClose={onSelectCryptoClose} />,
        }}
      />

      {/* Select Account */}
      <Stack.Screen
        name={ScreenName.ReceiveSelectAccount}
        component={ReceiveSelectAccount}
        options={{
          headerTitle: "",
          headerRight: <HeaderRightClose onClose={onSelectAccountClose} />,
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
          headerRight: <HeaderRightClose onClose={onConnectDeviceClose} />,
          headerLeft: <HeaderBackButton onPress={onConnectDeviceBack} />,
        }}
      />
      {/* Select / Connect Device */}
      <Stack.Screen
        name={ScreenName.ReceiveVerifyAddress}
        component={ReceiveVerifyAddress}
        options={{
          headerTitle: "",
          headerLeft: null,
          headerRight: <HeaderRightClose onClose={onVerifyAddressClose} />,
        }}
      />
      {/* Add account(s) automatically */}
      {/* Receive Address */}
      <Stack.Screen
        name={ScreenName.ReceiveConfirmation}
        component={ReceiveConfirmation}
        options={{
          headerTitle: "",
          headerLeft: null,
          headerRight: <HeaderRightClose onClose={onConfirmationClose} />,
        }}
      />
      {/* Receive Address Device Verification */}
    </Stack.Navigator>
  );
}

const Stack = createStackNavigator();
