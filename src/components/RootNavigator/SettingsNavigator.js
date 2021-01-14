// @flow
import React, { useMemo } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { useTranslation } from "react-i18next";
import { useTheme } from "@react-navigation/native";
import { ScreenName, NavigatorName } from "../../const";
import BenchmarkQRStream from "../../screens/BenchmarkQRStream";
import DebugBLE from "../../screens/DebugBLE";
import DebugBLEBenchmark from "../../screens/DebugBLEBenchmark";
import DebugCrash from "../../screens/DebugCrash";
import DebugHttpTransport from "../../screens/DebugHttpTransport";
import DebugIcons from "../../screens/DebugIcons";
import DebugLottie from "../../screens/DebugLottie.js";
import DebugStore from "../../screens/DebugStore";
import DebugPlayground from "../../screens/DebugPlayground";
import Settings from "../../screens/Settings";
import AccountsSettings from "../../screens/Settings/Accounts";
import AboutSettings from "../../screens/Settings/About";
import Resources from "../../screens/Settings/Resources";
import GeneralSettings from "../../screens/Settings/General";
import CountervalueSettings from "../../screens/Settings/General/CountervalueSettings";
import HelpSettings from "../../screens/Settings/Help";
import CurrenciesList from "../../screens/Settings/CryptoAssets/Currencies/CurrenciesList";
import CurrencySettings from "../../screens/Settings/CryptoAssets/Currencies/CurrencySettings";
import DebugSettings, {
  DebugDevices,
  DebugMocks,
} from "../../screens/Settings/Debug";
import DebugExport from "../../screens/Settings/Debug/ExportAccounts";
import ExperimentalSettings from "../../screens/Settings/Experimental";
import RepairDevice from "../../screens/RepairDevice";
import { getStackNavigatorConfig } from "../../navigation/navigatorConfig";
import Button from "../Button";
import OnboardingNavigator from "./OnboardingNavigator";
import HelpButton from "../../screens/Settings/HelpButton";

export default function SettingsNavigator() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const stackNavConfig = useMemo(() => getStackNavigatorConfig(colors), [
    colors,
  ]);
  return (
    <Stack.Navigator screenOptions={stackNavConfig}>
      <Stack.Screen
        name={ScreenName.Settings}
        component={Settings}
        options={{
          title: t("settings.header"),
          headerRight: () => <HelpButton />,
        }}
      />
      <Stack.Screen
        name={ScreenName.CountervalueSettings}
        component={CountervalueSettings}
        options={{
          title: t("settings.display.counterValue"),
        }}
      />
      <Stack.Screen
        name={ScreenName.GeneralSettings}
        component={GeneralSettings}
        options={{
          title: t("settings.display.title"),
        }}
      />
      <Stack.Screen
        name={ScreenName.AccountsSettings}
        component={AccountsSettings}
        options={{
          title: t("settings.accounts.title"),
        }}
      />
      <Stack.Screen
        name={ScreenName.AboutSettings}
        component={AboutSettings}
        options={{
          title: t("settings.about.title"),
        }}
      />
      <Stack.Screen
        name={ScreenName.HelpSettings}
        component={HelpSettings}
        options={{
          title: t("settings.help.header"),
        }}
      />
      <Stack.Screen
        name={ScreenName.Resources}
        component={Resources}
        options={{ title: t("settings.resources") }}
      />
      <Stack.Screen
        name={ScreenName.CryptoAssetsSettings}
        component={CurrenciesList}
        options={{ title: t("settings.accounts.cryptoAssets.header") }}
      />
      <Stack.Screen
        name={ScreenName.CurrencySettings}
        component={CurrencySettings}
        options={({ route }) => ({
          title: route.params.headerTitle,
          headerRight: null,
        })}
      />
      <Stack.Screen
        name={ScreenName.RepairDevice}
        component={RepairDevice}
        options={{
          title: t("RepairDevice.title"),
        }}
      />
      <Stack.Screen
        name={ScreenName.ExperimentalSettings}
        component={ExperimentalSettings}
        options={{
          title: t("settings.experimental.title"),
        }}
      />
      <Stack.Screen
        name={ScreenName.DebugSettings}
        component={DebugSettings}
        options={{
          title: "Debug",
        }}
      />
      <Stack.Screen
        name={ScreenName.DebugDevices}
        component={DebugDevices}
        options={{
          title: "Debug Devices",
        }}
      />
      <Stack.Screen
        name={ScreenName.DebugMocks}
        component={DebugMocks}
        options={{
          title: "Mock & Test",
        }}
      />
      <Stack.Screen
        name={ScreenName.DebugExport}
        component={DebugExport}
        options={{
          title: "Export Accounts",
        }}
      />
      <Stack.Screen
        name={ScreenName.DebugBLE}
        component={DebugBLE}
        options={({ route, navigation }) => ({
          title: "Debug BLE",
          headerRight: () => (
            <Button
              event="DebugBLEBenchmark"
              type="lightSecondary"
              containerStyle={{ width: 100 }}
              onPress={() =>
                navigation.navigate(ScreenName.DebugBLEBenchmark, {
                  deviceId: route.params?.deviceId,
                })
              }
              title="Benchmark"
            />
          ),
        })}
      />
      <Stack.Screen
        name={ScreenName.DebugBLEBenchmark}
        component={DebugBLEBenchmark}
        options={{
          title: "Debug BLE Benchmark",
        }}
      />
      <Stack.Screen
        name={ScreenName.DebugCrash}
        component={DebugCrash}
        options={{
          title: "Debug Crash",
        }}
      />
      <Stack.Screen
        name={ScreenName.DebugStore}
        component={DebugStore}
        options={{
          title: "Debug Store",
        }}
      />
      <Stack.Screen
        name={ScreenName.DebugHttpTransport}
        component={DebugHttpTransport}
        options={{
          title: "Debug Http Transport",
        }}
      />
      <Stack.Screen
        name={ScreenName.DebugIcons}
        component={DebugIcons}
        options={{
          title: "Debug Icons",
        }}
      />
      <Stack.Screen
        name={ScreenName.DebugLottie}
        component={DebugLottie}
        options={{
          title: "Debug Lottie",
        }}
      />
      <Stack.Screen
        name={ScreenName.DebugPlayground}
        component={DebugPlayground}
        options={{
          title: "Playground for testing",
        }}
      />
      <Stack.Screen
        name={ScreenName.BenchmarkQRStream}
        component={BenchmarkQRStream}
        options={{
          title: "Benchmark QRStream",
        }}
      />
      <Stack.Screen
        name={NavigatorName.Onboarding}
        component={OnboardingNavigator}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

const Stack = createStackNavigator();
