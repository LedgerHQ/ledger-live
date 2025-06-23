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

const checkLLmVersion = (
  appVersion: string,
  osVersion: string,
  platform: "ios" | "android",
  llmMinVersionConfig: LLMinVersionConfig["llm"],
) => {
  if (!llmMinVersionConfig[platform]) {
    return false;
  }

  return llmMinVersionConfig[platform]
    .filter(minVersionConfig =>
      semver.satisfies(semver.coerce(osVersion), `>=${minVersionConfig.minOsVersion}`),
    )
    .reduce((acc, curr) => {
      return acc || semver.satisfies(appVersion, `<${curr.version}`);
    }, false);
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
  const llMinVersionConfig = getConfigValue("config_ll_min_version");
  const appVersion = semver.coerce(uncoercedAppVersion)?.version || "";
  let shouldUpdate = false;

  if (!llMinVersionConfig) {
    return { shouldUpdate };
  }

  if (appKey === "llm" && (platform === "android" || platform === "ios") && osVersion) {
    shouldUpdate = checkLLmVersion(appVersion, osVersion, platform, llMinVersionConfig[appKey]);
  }
  return { shouldUpdate };
};
