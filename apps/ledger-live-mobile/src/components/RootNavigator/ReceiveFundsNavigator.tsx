import React, { useCallback, useMemo } from "react";
import { Platform } from "react-native";
import { createStackNavigator } from "@react-navigation/stack";
import { useTheme } from "styled-components/native";
import { useTranslation } from "react-i18next";
import { HeaderBackButton } from "@react-navigation/elements";
import { useRoute } from "@react-navigation/native";
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
  const route = useRoute();

  const onClose = useCallback(() => {
    track("button_clicked", {
      button: "Close 'x'",
      screen: route.name,
    });
  }, [route]);

  const stackNavigationConfig = useMemo(
    () => ({
      ...getStackNavigatorConfig(colors, true),
      headerRight: () => <HeaderRightClose onClose={onClose} />,
    }),
    [colors, onClose],
  );

  const onConnectDeviceBack = useCallback((navigation: any) => {
    track("button_clicked", {
      button: "Back arrow",
      screen: ScreenName.ReceiveConnectDevice,
    });
    navigation.goBack();
  }, []);

  const onConfirmationClose = useCallback(() => {
    track("button_clicked", {
      button: "HeaderRight Close",
      screen: ScreenName.ReceiveConfirmation,
    });
  }, []);

  const onVerificationConfirmationClose = useCallback(() => {
    track("button_clicked", {
      button: "HeaderRight Close",
      screen: ScreenName.ReceiveVerificationConfirmation,
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
          headerLeft: () => null,
          headerTitle: "",
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
          headerLeft: () => (
            <HeaderBackButton onPress={() => onConnectDeviceBack(navigation)} />
          ),
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
        options={{
          headerTitle: "",
          headerLeft: () => null,
          headerRight: () => <HeaderRightClose onClose={onConfirmationClose} />,
        }}
      />
      {/* Receive Address Device Verification */}
      <Stack.Screen
        name={ScreenName.ReceiveVerificationConfirmation}
        component={ReceiveConfirmation}
        options={{
          headerTitle: "",
          headerLeft: () => null,
          headerRight: () => (
            <HeaderRightClose onClose={onVerificationConfirmationClose} />
          ),
        }}
      />
    </Stack.Navigator>
  );
}

const Stack = createStackNavigator();
