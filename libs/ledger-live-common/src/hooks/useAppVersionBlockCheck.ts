import semver from "semver";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";

type LLMMinVersionConfig = {
  minOsVersion: string;
  version: string;
};

type LLMinVersionConfig = {
  lld: {
    windows: string;
    macOS: string;
    linux: string;
  };
  llm: {
    android: LLMMinVersionConfig[];
    ios: LLMMinVersionConfig[];
  };
};

export const useAppVersionBlockCheck = ({
  appVersion: uncoercedAppVersion,
  appKey,
  platform,
  osVersion,
  getConfigValue = LiveConfig.getValueByKey,
}: {
  appVersion: string;
  osVersion?: string;
  appKey: "llm" | "lld";
  platform: "ios" | "android" | "macOS" | "windows" | "linux";
  getConfigValue?: typeof LiveConfig.getValueByKey;
}) => {
  const llMinVersionConfig: LLMinVersionConfig = getConfigValue("config_ll_min_version");
  const appVersion = semver.coerce(uncoercedAppVersion)?.version || "";
  let shouldUpdate = false;

  if (!llMinVersionConfig || !llMinVersionConfig[appKey][platform]) {
    return { shouldUpdate };
  }
  if (appKey === "llm" && (platform === "android" || platform === "ios") && osVersion) {
    shouldUpdate = llMinVersionConfig[appKey][platform]
      .filter(minVersionConfig =>
        semver.satisfies(semver.coerce(osVersion), `>=${minVersionConfig.minOsVersion}`),
      )
      .reduce((acc, curr) => {
        return acc || semver.satisfies(appVersion, `<${semver.coerce(curr.version)}`);
      }, false);
  } else if (
    appKey === "lld" &&
    (platform === "windows" || platform === "macOS" || platform === "linux")
  ) {
    shouldUpdate = semver.satisfies(
      appVersion,
      `<${semver.coerce(llMinVersionConfig[appKey][platform])}`,
    );
  }
  return { shouldUpdate };
};
