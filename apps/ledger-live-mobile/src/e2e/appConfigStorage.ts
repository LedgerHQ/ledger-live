import { LaunchArguments } from "react-native-launch-arguments";
import { readOnlyConfigStorage } from "@shared/app-config";

/**
 * The app config selections of an e2e run: the `appConfig` launch argument, a JSON object of
 * option ids by switch id. Detox has to pass it as a JSON string, because iOS stringifies launch
 * arguments with `${value}`; `react-native-launch-arguments` parses it back. Nothing is persisted.
 */
export const e2eAppConfigStorage = readOnlyConfigStorage(
  () => LaunchArguments.value<{ appConfig?: unknown }>().appConfig,
);
