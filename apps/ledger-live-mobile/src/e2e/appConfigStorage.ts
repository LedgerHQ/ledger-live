import { LaunchArguments } from "react-native-launch-arguments";
import { readOnlyConfigStorage, type AppConfigStorage } from "@shared/app-config";

type AppConfigLaunchArguments = { appConfig?: unknown; appConfigDevValues?: unknown };

/**
 * The app config of an e2e run, from the launch arguments: `appConfig`, a JSON object of selections
 * by switch or fixed value, and `appConfigDevValues`, a JSON object of dev values by value name.
 * Detox has to pass them as JSON strings, because iOS stringifies launch arguments with `${value}`;
 * `react-native-launch-arguments` parses them back. Nothing is persisted.
 */
export const e2eAppConfigStorage: AppConfigStorage = {
  selections: readOnlyConfigStorage(
    () => LaunchArguments.value<AppConfigLaunchArguments>().appConfig,
  ),
  devValues: readOnlyConfigStorage(
    () => LaunchArguments.value<AppConfigLaunchArguments>().appConfigDevValues,
  ),
};
