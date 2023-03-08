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
  MultiversX: ">= 1.0.18",
  Polkadot: ">= 19.9360.2",
  Ethereum: ">= 1.10.1-0",
  Solana: ">= 1.2.0",
  Celo: ">= 1.1.8",
  "Cardano ADA": ">= 4.1.0",
  Bitcoin: ">= 2.1.0",
  "Bitcoin Test": ">= 2.1.0",
  Zcash: ">= 2.1.0",
  BitcoinGold: ">= 2.1.0",
  BitcoinCash: ">= 2.1.0",
  Peercoin: ">= 2.1.0",
  PivX: ">= 2.1.0",
  Qtum: ">= 2.1.0",
  Vertcoin: ">= 2.1.0",
  Viacoin: ">= 2.1.0",
  Dash: ">= 2.1.0",
  Dogecoin: ">= 2.1.0",
  Horizen: ">= 2.1.0",
  Digibyte: ">= 2.1.0",
  Komodo: ">= 2.1.0",
  Decred: ">= 2.1.0",
  Litecoin: ">= 2.1.0",
  NEAR: ">= 1.2.1",
  Exchange: ">= 2.0.12",
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
