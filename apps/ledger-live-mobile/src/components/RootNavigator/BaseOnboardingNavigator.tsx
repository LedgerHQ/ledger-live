import React, { useCallback, useMemo } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { useTranslation } from "react-i18next";
import { useTheme } from "styled-components/native";
import { TouchableOpacity } from "react-native";
import { ScreenName, NavigatorName } from "~/const";
import PairDevices from "~/screens/PairDevices";
import EditDeviceName from "~/screens/EditDeviceName";
import OnboardingNavigator from "./OnboardingNavigator";
import { SyncOnboardingNavigator } from "./SyncOnboardingNavigator";
import ImportAccountsNavigator from "./ImportAccountsNavigator";
import PasswordAddFlowNavigator from "./PasswordAddFlowNavigator";
import PasswordModifyFlowNavigator from "./PasswordModifyFlowNavigator";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import Question from "~/icons/Question";
import BuyDeviceNavigator from "./BuyDeviceNavigator";
import { BaseOnboardingNavigatorParamList } from "./types/BaseOnboardingNavigator";
import { RootComposite, StackNavigatorProps } from "./types/helpers";
import { BaseNavigatorStackParamList } from "./types/BaseNavigator";
import { NavigationHeaderBackButton } from "../NavigationHeaderBackButton";

const hitSlop = {
  bottom: 10,
  left: 24,
  right: 24,
  top: 10,
};

type ErrorHeaderInfoNavigatorProps = RootComposite<
  | StackNavigatorProps<BaseNavigatorStackParamList, ScreenName.PairDevices>
  | StackNavigatorProps<BaseOnboardingNavigatorParamList, ScreenName.PairDevices>
>;

export const ErrorHeaderInfo = ({ route, navigation }: ErrorHeaderInfoNavigatorProps) => {
  const { colors } = useTheme();
  const openInfoModal = useCallback(() => {
    // FIXME: OnboardingInfoModal belongs to the "OnboardingNavigator", not the "BaseOnboardingNavigator"
    // So I'm not sure if the redirection works at all.
    // @ts-expect-error Typescript seems be right here…
    navigation.navigate(ScreenName.OnboardingInfoModal, {
      sceneInfoKey: "pairNewErrorInfoModalProps",
    });
  }, [navigation]);

  return route.params?.hasError ? (
    <TouchableOpacity
      style={{
        marginRight: 24,
      }}
      hitSlop={hitSlop}
      onPress={openInfoModal}
    >
      <Question size={20} color={colors.neutral.c70} />
    </TouchableOpacity>
  ) : null;
};
export default function BaseOnboardingNavigator() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const stackNavigationConfig = useMemo(() => getStackNavigatorConfig(colors, true), [colors]);
  return (
    <Stack.Navigator
      screenOptions={{
        ...stackNavigationConfig,
        headerShown: false,
      }}
    >
      <Stack.Screen name={NavigatorName.Onboarding} component={OnboardingNavigator} />
      <Stack.Screen name={NavigatorName.SyncOnboarding} component={SyncOnboardingNavigator} />
      <Stack.Screen name={NavigatorName.ImportAccounts} component={ImportAccountsNavigator} />
      <Stack.Screen
        name={NavigatorName.BuyDevice}
        component={BuyDeviceNavigator}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name={ScreenName.PairDevices}
        component={PairDevices}
        options={{
          title: "",
          headerLeft: () => <NavigationHeaderBackButton />,
          headerRight: () => null,
          headerShown: true,
        }}
      />
      <Stack.Screen
        name={ScreenName.EditDeviceName}
        component={EditDeviceName}
        options={{
          title: t("EditDeviceName.title"),
          headerLeft: () => null,
          headerShown: true,
        }}
      />
      <Stack.Screen name={NavigatorName.PasswordAddFlow} component={PasswordAddFlowNavigator} />
      <Stack.Screen
        name={NavigatorName.PasswordModifyFlow}
        component={PasswordModifyFlowNavigator}
      />
    </Stack.Navigator>
  );
}
const Stack = createStackNavigator<BaseOnboardingNavigatorParamList>();
