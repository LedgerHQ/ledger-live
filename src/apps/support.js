// @flow

import semver from "semver";
import type { DeviceModelId } from "@ledgerhq/devices";
import { getDependencies } from "./polyfill";
import { getEnv } from "../env";

export function shouldUpgrade(
  deviceModel: DeviceModelId,
  appName: string,
  appVersion: string
) {
  if (getEnv("DISABLE_APP_VERSION_REQUIREMENTS")) return false;
  const deps = getDependencies(appName);
  if (deps.includes("Bitcoin") || appName === "Bitcoin") {
    // https://donjon.ledger.com/lsb/010/
    return !semver.satisfies(appVersion, ">= 1.4.0");
  }
  return false;
}

const appVersionsRequired = {
  Cosmos: ">= 2.14",
};

export function mustUpgrade(
  deviceModel: DeviceModelId,
  appName: string,
  appVersion: string
) {
  if (getEnv("DISABLE_APP_VERSION_REQUIREMENTS")) return false;
  const range = appVersionsRequired[appName];
  if (range) {
    return !semver.satisfies(appVersion, range);
  }
  return false;
}
