// @flow

import { Platform } from "react-native";

const mega = 1048576;
export const getAndroidArchitecture = (buildVersion?: ?string) => {
  const buildVersionNumber = parseInt(buildVersion, 10);
  if (!buildVersionNumber) return "";

  if (Platform.OS === "android" && buildVersionNumber) {
    // https://github.com/LedgerHQ/ledger-live-mobile/blob/develop/android/app/build.gradle#L166
    const platforms = ["armeabi-v7a", "x86", "arm64-v8a", "x86_64"];
    return platforms[Math.floor(buildVersionNumber / mega) - 1];
  }

  return buildVersion;
};

export const getAndroidVersionCode = (buildVersion?: ?string) => {
  const buildVersionNumber = parseInt(buildVersion, 10);
  if (!buildVersionNumber) return "";

  return Platform.OS === "android" && buildVersionNumber
    ? buildVersionNumber % mega
    : buildVersion;
};

export default (buildVersion?: ?string) => {
  if (Platform.OS === "android" && buildVersion) {
    return `${getAndroidArchitecture(buildVersion) ||
      ""} ${getAndroidVersionCode(buildVersion) || ""}`;
  }
  return buildVersion;
};
