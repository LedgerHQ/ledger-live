import invariant from "invariant";
import { log } from "@ledgerhq/logs";
import {
  listAppCandidates,
  createSpeculosDevice,
  releaseSpeculosDevice,
  findAppCandidate,
  SpeculosTransport,
} from "@ledgerhq/live-common/load/speculos";
import { SpeculosDevice } from "@ledgerhq/speculos-transport";
import type { AppCandidate } from "@ledgerhq/coin-framework/bot/types";
import { DeviceModelId } from "@ledgerhq/devices";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import axios from "axios";
import { getEnv } from "@ledgerhq/live-env";
import { waitForTimeOut } from "./waitFor";

export type Spec = {
  currency: CryptoCurrency;
  appQuery: {
    model: DeviceModelId;
    appName: string;
    appVersion: string;
  };
  dependency: string;
  onSpeculosDeviceCreated?: (device: Device) => Promise<void>;
};

type Specs = {
  [key: string]: Spec;
};

export type Device = {
  transport: SpeculosTransport;
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
  Ethereum_Sepolia: {
    currency: getCryptoCurrencyById("ethereum_sepolia"),
    appQuery: {
      model: DeviceModelId.nanoSP,
      appName: "Ethereum",
      appVersion: "1.10.4",
    },
    dependency: "",
  },
  Ethereum_Classic: {
    currency: getCryptoCurrencyById("ethereum_classic"),
    appQuery: {
      model: DeviceModelId.nanoSP,
      appName: "Ethereum Classic",
      appVersion: "1.10.4",
    },
    dependency: "Ethereum",
  },
  Bitcoin_Testnet: {
    currency: getCryptoCurrencyById("bitcoin_testnet"),
    appQuery: {
      model: DeviceModelId.nanoSP,
      appName: "Bitcoin Test",
      appVersion: "2.2.2",
    },
    dependency: "",
  },
  Solana: {
    currency: getCryptoCurrencyById("solana"),
    appQuery: {
      model: DeviceModelId.nanoSP,
      appName: "Solana",
      appVersion: "1.4.1",
    },
    dependency: "",
  },
  Cardano: {
    currency: getCryptoCurrencyById("cardano"),
    appQuery: {
      model: DeviceModelId.nanoSP,
      appName: "CardanoADA",
      appVersion: "6.1.2",
    },
    dependency: "",
  },
  Polkadot: {
    currency: getCryptoCurrencyById("polkadot"),
    appQuery: {
      model: DeviceModelId.nanoSP,
      appName: "Polkadot",
      appVersion: "100.0.5",
    },
    dependency: "",
  },
  Tron: {
    currency: getCryptoCurrencyById("tron"),
    appQuery: {
      model: DeviceModelId.nanoSP,
      appName: "Tron",
      appVersion: "0.5.0",
    },
    dependency: "",
  },
  Ripple: {
    currency: getCryptoCurrencyById("ripple"),
    appQuery: {
      model: DeviceModelId.nanoSP,
      appName: "XRP",
      appVersion: "2.2.3",
    },
    dependency: "",
  },
  Stellar: {
    currency: getCryptoCurrencyById("stellar"),
    appQuery: {
      model: DeviceModelId.nanoSP,
      appName: "Stellar",
      appVersion: "5.0.3",
    },
    dependency: "",
  },
  Bitcoin_Cash: {
    currency: getCryptoCurrencyById("bitcoin_cash"),
    appQuery: {
      model: DeviceModelId.nanoSP,
      appName: "Bitcoin Cash",
      appVersion: "2.4.1",
    },
    dependency: "",
  },
  Algorand: {
    currency: getCryptoCurrencyById("algorand"),
    appQuery: {
      model: DeviceModelId.nanoSP,
      appName: "Algorand",
      appVersion: "2.1.11",
    },
    dependency: "",
  },
  Cosmos: {
    currency: getCryptoCurrencyById("cosmos"),
    appQuery: {
      model: DeviceModelId.nanoSP,
      appName: "Cosmos",
      appVersion: "2.35.22",
    },
    dependency: "",
  },
  Tezos: {
    currency: getCryptoCurrencyById("tezos"),
    appQuery: {
      model: DeviceModelId.nanoSP,
      appName: "TezosWallet",
      appVersion: "2.4.5",
    },
    dependency: "",
  },
  Polygon: {
    currency: getCryptoCurrencyById("polygon"),
    appQuery: {
      model: DeviceModelId.nanoSP,
      appName: "Polygon",
      appVersion: "1.10.4",
    },
    dependency: "",
  },
  Binance_Smart_Chain: {
    currency: getCryptoCurrencyById("bsc"),
    appQuery: {
      model: DeviceModelId.nanoSP,
      appName: "Binance Smart Chain",
      appVersion: "1.10.4",
    },
    dependency: "",
  },
};

export async function startSpeculos(
  testName: string,
  spec: Specs[keyof Specs],
): Promise<SpeculosDevice | undefined> {
  log("engine", `test ${testName}`);

  const { SEED, COINAPPS } = process.env;

  const seed = SEED;
  invariant(seed, "SEED is not set");
  const coinapps = COINAPPS;
  invariant(coinapps, "COINAPPS is not set");
  let appCandidates;

  if (!appCandidates) {
    appCandidates = await listAppCandidates(coinapps);
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

export async function stopSpeculos(device: Device | undefined) {
  if (device) {
    log("engine", `test ${device.id} finished`);
    await releaseSpeculosDevice(device.id);
  }
}

interface Event {
  text: string;
}

interface ResponseData {
  events: Event[];
}

export async function waitFor(text: string, maxAttempts: number = 10): Promise<string[]> {
  const speculosApiPort = getEnv("SPECULOS_API_PORT");
  let attempts = 0;
  let textFound: boolean = false;
  while (attempts < maxAttempts && !textFound) {
    const response = await axios.get<ResponseData>(
      `http://127.0.0.1:${speculosApiPort}/events?stream=false&currentscreenonly=true`,
    );
    const responseData = response.data;
    const texts = responseData.events.map(event => event.text);

    if (texts[0].includes(text)) {
      textFound = true;
      return texts;
    }
    attempts++;
    await waitForTimeOut(500);
  }
  return [];
}

export async function pressBoth() {
  const speculosApiPort = getEnv("SPECULOS_API_PORT");
  await axios.post(`http://127.0.0.1:${speculosApiPort}/button/both`, {
    action: "press-and-release",
  });
}

export async function pressRightUntil(text: string, maxAttempts: number = 10): Promise<string[]> {
  const speculosApiPort = getEnv("SPECULOS_API_PORT");
  let attempts = 0;
  let textFound: boolean = false;
  while (attempts < maxAttempts && !textFound) {
    const response = await axios.get<ResponseData>(
      `http://127.0.0.1:${speculosApiPort}/events?stream=false&currentscreenonly=true`,
    );
    const responseData = response.data;
    const texts = responseData.events.map(event => event.text);

    if (texts[0].includes(text)) {
      textFound = true;
      return texts;
    }

    await axios.post(`http://127.0.0.1:${speculosApiPort}/button/right`, {
      action: "press-and-release",
    });
    attempts++;
  }

  if (attempts === maxAttempts) {
    throw new Error(
      `ElementNotFoundException: Element with text "${text}" not found on speculos device`,
    );
  }
  await waitForTimeOut(100);
  return [];
}

export function verifyAddress(address: string, text: string[]): boolean {
  const textConcat = text.slice(1).join("");
  return textConcat.includes(address);
}

export function verifyAmount(amount: string, text: string[]): boolean {
  const amountDevice = text[1];
  return amountDevice.includes(amount);
}
