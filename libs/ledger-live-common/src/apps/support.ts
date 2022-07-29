import semver from "semver";
import { shouldUseTrustedInputForSegwit } from "@ledgerhq/hw-app-btc/shouldUseTrustedInputForSegwit";
import type { DeviceModelId } from "@ledgerhq/devices";
import { getDependencies } from "./polyfill";
import { getEnv } from "../env";

export function shouldUpgrade(
  deviceModel: DeviceModelId,
  appName: string,
  appVersion: string
): boolean {
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
    return !semver.satisfies(appVersion || "", ">= 1.4.0", {
      includePrerelease: true, // this will allow pre-release tags that would otherwise return false. E.g. 1.0.0-dev
    });
  }

  return false;
}
const appVersionsRequired = {
  Cosmos: ">= 2.34.4",
  Algorand: ">= 1.2.9",
  Polkadot: ">= 13.9250.0",
  Elrond: ">= 1.0.11",
  Ethereum: ">= 1.9.17",
  Solana: ">= 1.2.0",
  Celo: ">= 1.1.8",
  "Cardano ADA": ">= 4.1.0",
};
export function mustUpgrade(
  deviceModel: DeviceModelId,
  appName: string,
  appVersion: string
): boolean {
  if (getEnv("DISABLE_APP_VERSION_REQUIREMENTS")) return false;
  const range = appVersionsRequired[appName];

  if (range) {
    return !semver.satisfies(appVersion || "", range, {
      includePrerelease: true, // this will allow pre-release tags that would otherwise return false. E.g. 1.0.0-dev
    });
  }

  return false;
}
