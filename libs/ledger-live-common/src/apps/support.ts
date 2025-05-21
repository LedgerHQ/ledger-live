import semver from "semver";
import { shouldUseTrustedInputForSegwit } from "@ledgerhq/hw-app-btc/shouldUseTrustedInputForSegwit";
import { getDependencies } from "./polyfill";
import { getEnv } from "@ledgerhq/live-env";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { DeviceModelId, deviceIdsList } from "@ledgerhq/devices";
import { includes } from "../helpers";

export function shouldUpgrade(appName: string, appVersion: string): boolean {
  if (getEnv("DISABLE_APP_VERSION_REQUIREMENTS")) return false;
  const deps = getDependencies(appName);

  if (
    (deps.includes("Bitcoin") &&
      shouldUseTrustedInputForSegwit({
        name: appName,
        version: "1.4.0",
      })) ||
    appName === "Bitcoin"
  ) {
    // https://donjon.ledger.com/lsb/010/
    // the `-0` is here to allow for pre-release tags of the 1.4.0
    return !semver.satisfies(appVersion || "", ">= 1.4.0-0", {
      includePrerelease: true, // this will allow pre-release tags for higher versions (> 1.4.0)
    });
  }

  return false;
}

export function hasDeviceConfigForApp(appName: string): boolean {
  if (getEnv("DISABLE_APP_VERSION_REQUIREMENTS")) return false;
  // we should convert the app name to camel case and replace spaces with underscores to match the config convention in firebase
  const config = LiveConfig.getValueByKey(
    `config_nanoapp_${appName.toLowerCase().replace(/ /g, "_")}`,
  );

  if (!config) return false;

  return Object.keys(config).some(key => includes(deviceIdsList, key));
}

export function mustUpgrade(
  appName: string,
  appVersion: string,
  deviceModelId?: DeviceModelId,
): boolean {
  if (getEnv("DISABLE_APP_VERSION_REQUIREMENTS")) return false;
  // we should convert the app name to camel case and replace spaces with underscores to match the config convention in firebase
  const config = LiveConfig.getValueByKey(
    `config_nanoapp_${appName.toLowerCase().replace(/ /g, "_")}`,
  );
  const deviceConfig = deviceModelId ? config?.[deviceModelId] : undefined;
  const minVersion = deviceConfig?.minVersion || config?.minVersion;
  if (minVersion) {
    // necessary when using test versions on other providers that often end up on -dev
    const appVersionCoerced = semver.coerce(appVersion);
    return !semver.gte(appVersionCoerced || "", minVersion, {
      includePrerelease: true, // this will allow pre-release tags for higher versions than the minimum one
    });
  }
  return false;
}
