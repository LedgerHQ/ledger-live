import { Platform } from "react-native";
import VersionNumber from "react-native-version-number";

const { appVersion, buildVersion } = VersionNumber;

const mega = 1048576;
export const getAndroidArchitecture = (buildVersionArg = buildVersion) => {
  const buildVersionNumber = parseInt(buildVersionArg, 10);
  if (!buildVersionNumber) return "";

  if (Platform.OS === "android" && buildVersionNumber) {
    // https://github.com/LedgerHQ/ledger-live-mobile/blob/develop/android/app/build.gradle#L166
    const platforms = ["armeabi-v7a", "x86", "arm64-v8a", "x86_64"];
    return platforms[Math.floor(buildVersionNumber / mega) - 1];
  }

  return buildVersion;
};

export const getAndroidVersionCode = (buildVersionArg = buildVersion) => {
  const buildVersionNumber = parseInt(buildVersionArg, 10);
  if (!buildVersionNumber) return "";

  return Platform.OS === "android" && buildVersionNumber
    ? buildVersionNumber % mega
    : buildVersionArg;
};

export const cleanBuildVersion = (buildVersionArg = buildVersion) => {
  if (Platform.OS === "android" && buildVersionArg) {
    return `${getAndroidArchitecture(buildVersionArg) ||
      ""} ${getAndroidVersionCode(buildVersionArg) || ""}`;
  }
  return buildVersionArg;
};

export default function getFullAppVersion(
  appVersionArg = appVersion,
  buildVersionArg = buildVersion,
  separator = " ",
) {
  return `${appVersionArg || ""}${separator}(${cleanBuildVersion(
    buildVersionArg,
  ) || ""})`;
}
