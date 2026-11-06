import { Platform } from "react-native";
import Config from "react-native-config";
import { nativeApplicationVersion, nativeBuildVersion } from "expo-application";
import packageJson from "../../../package.json";

const toFastlaneIosVersion = (version: string) => version.split(/[+-]/)[0];

const detoxAppVersion =
  Platform.OS === "ios" ? toFastlaneIosVersion(packageJson.version) : packageJson.version;

export const appVersion = (Config.DETOX ? detoxAppVersion : nativeApplicationVersion) ?? "";
export const buildVersion = nativeBuildVersion ?? "";
