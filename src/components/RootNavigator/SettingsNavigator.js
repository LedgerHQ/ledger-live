// @flow
import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { useTranslation } from "react-i18next";
import { ScreenName, NavigatorName } from "../../const";
import BenchmarkQRStream from "../../screens/BenchmarkQRStream";
import DebugBLE from "../../screens/DebugBLE";
import DebugBLEBenchmark from "../../screens/DebugBLEBenchmark";
import DebugCrash from "../../screens/DebugCrash";
import DebugHttpTransport from "../../screens/DebugHttpTransport";
import DebugIcons from "../../screens/DebugIcons";
import DebugLottie from "../../screens/DebugLottie.js";
import DebugStore from "../../screens/DebugStore";
import DebugSVG from "../../screens/DebugSVG";
import DebugWSImport from "../../screens/DebugWSImport";
import Settings from "../../screens/Settings";
import AccountsSettings from "../../screens/Settings/Accounts";
import AboutSettings from "../../screens/Settings/About";
import GeneralSettings from "../../screens/Settings/General";
import CountervalueSettings from "../../screens/Settings/General/CountervalueSettings";
import HelpSettings from "../../screens/Settings/Help";
import CryptoAssetsSettingsTab from "./CryptoAssetsSettingsNavigator";
import CurrencySettings from "../../screens/Settings/CryptoAssets/Currencies/CurrencySettings";
import DebugSettings, {
  DebugDevices,
  DebugMocks,
} from "../../screens/Settings/Debug";
import DebugExport from "../../screens/Settings/Debug/ExportAccounts";
import ExperimentalSettings from "../../screens/Settings/Experimental";
import RateProviderSettings from "../../screens/Settings/CryptoAssets/Rates/RateProviderSettings";
import RepairDevice from "../../screens/RepairDevice";
import { stackNavigatorConfig } from "../../navigation/navigatorConfig";
import Button from "../Button";
import OnboardingNavigator from "./OnboardingNavigator";

export default function SettingsNavigator() {
  const { t } = useTranslation();

  return (
    <Stack.Navigator screenOptions={stackNavigatorConfig}>
      <Stack.Screen
        name={ScreenName.Settings}
        component={Settings}
        options={{
          title: t("settings.header"),
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
        name={NavigatorName.CryptoAssetsSettings}
        component={CryptoAssetsSettingsTab}
        options={{ title: t("settings.cryptoAssets.header") }}
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
        name={ScreenName.RateProviderSettings}
        component={RateProviderSettings}
        options={{
          title: t("settings.cryptoAssets.rateProviderHeader"),
          headerRight: null,
        }}
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
        options={({ route, navigation }) => {
          return {
            title: "Export Accounts",
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
          };
        }}
      />
      <Stack.Screen
        name={ScreenName.DebugBLE}
        component={DebugBLE}
        options={{
          title: "Debug BLE",
        }}
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
        name={ScreenName.DebugSVG}
        component={DebugSVG}
        options={{
          title: "Debug Svg Icons",
        }}
      />
      <Stack.Screen
        name={ScreenName.DebugWSImport}
        component={DebugWSImport}
        options={{
          title: "Experimental WS Import",
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
