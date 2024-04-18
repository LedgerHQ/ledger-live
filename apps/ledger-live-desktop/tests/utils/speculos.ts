import invariant from "invariant";
import { log } from "@ledgerhq/logs";
import {
  listAppCandidates,
  createSpeculosDevice,
  releaseSpeculosDevice,
  findAppCandidate,
} from "@ledgerhq/live-common/load/speculos";
import type { AppCandidate } from "@ledgerhq/coin-framework/bot/types";
import { DeviceModelId } from "@ledgerhq/devices";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import SpeculosHttpTransport from "@ledgerhq/hw-transport-node-speculos-http";

type Specs = {
  [key: string]: {
    currency: CryptoCurrency;
    appQuery: {
      model: DeviceModelId;
      appName: string;
      appVersion: string;
    };
    dependency: string;
    onSpeculosDeviceCreated?: Promise<void>;
  };
};

export type Device = {
  transport: SpeculosHttpTransport;
  id: string;
  appPath: string;
};

export const specs: Specs = {
  Bitcoin: {
    currency: getCryptoCurrencyById("bitcoin"),
    appQuery: {
      model: DeviceModelId.nanoSP,
      appName: "Bitcoin",
      appVersion: "2.2.2",
    },
    dependency: "",
  },
  Ethereum: {
    currency: getCryptoCurrencyById("ethereum"),
    appQuery: {
      model: DeviceModelId.nanoSP,
      appName: "Ethereum",
      appVersion: "1.10.4",
    },
    dependency: "",
  },
  Ethereum_Holesky: {
    currency: getCryptoCurrencyById("ethereum_holesky"),
    appQuery: {
      model: DeviceModelId.nanoSP,
      appName: "Ethereum",
      appVersion: "1.10.4",
    },
    dependency: "",
  },
};

export async function startSpeculos(testName: string, spec: Specs[keyof Specs]) {
  log("engine", `test ${testName}`);

  const { SEED, COINAPPS } = process.env;

  const seed = SEED;
  invariant(seed, "SEED is not set");
  const coinapps = COINAPPS;
  invariant(coinapps, "COINAPPS is not set");
  let appCandidates;

  if (!appCandidates) {
    appCandidates = await listAppCandidates(coinapps);
    console.error(JSON.stringify(appCandidates, undefined, 2));
  }

  const { appQuery, dependency, onSpeculosDeviceCreated } = spec;
  const appCandidate = findAppCandidate(appCandidates, appQuery);
  if (!appCandidate) {
    console.warn("no app found for " + testName);
    console.warn(appQuery);
    console.warn(JSON.stringify(appCandidates, undefined, 2));
  }
  invariant(
    appCandidate,
    "%s: no app found. Are you sure your COINAPPS is up to date?",
    testName,
    coinapps,
  );
  log(
    "engine",
    `test ${testName} will use ${appCandidate.appName} ${appCandidate.appVersion} on ${appCandidate.model} ${appCandidate.firmware}`,
  );
  const deviceParams = {
    ...(appCandidate as AppCandidate),
    appName: spec.currency.managerAppName,
    seed,
    dependency,
    coinapps,
    onSpeculosDeviceCreated,
  };

  try {
    return await createSpeculosDevice(deviceParams);
  } catch (e: unknown) {
    if (process.env.CI) console.error(e);
    console.error(e);
    log("engine", `test ${testName} failed with ${String(e)}`);
  }
}

export async function stopSpeculos(device: Device | null) {
  if (device) {
    log("engine", `test ${device.id} finished`);
    await releaseSpeculosDevice(device.id);
  }
}
