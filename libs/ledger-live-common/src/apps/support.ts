import semver from "semver";
import { shouldUseTrustedInputForSegwit } from "@ledgerhq/hw-app-btc/shouldUseTrustedInputForSegwit";
import { getDependencies } from "./polyfill";
import { getEnv } from "../env";

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
const appVersionsRequired = {
  Cosmos: ">= 2.34.4",
  Algorand: ">= 1.2.9",
  MultiversX: ">= 1.0.18",
  Polkadot: ">= 24.9430.1",
  Ethereum: ">= 1.10.2-0", // the `-0` is here to allow for pre-release tags of the same version (1.10.2)
  Solana: ">= 1.2.0",
  Celo: ">= 1.1.8",
  "Cardano ADA": ">= 4.1.0",
  Zcash: "> 2.0.6",
  NEAR: ">= 1.2.1",
};
export function mustUpgrade(appName: string, appVersion: string): boolean {
  if (getEnv("DISABLE_APP_VERSION_REQUIREMENTS")) return false;
  const range = appVersionsRequired[appName];

  if (range) {
    return !semver.satisfies(appVersion || "", range, {
      includePrerelease: true, // this will allow pre-release tags for higher versions than the minimum one
    });
  }

  return false;
}
