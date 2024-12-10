import invariant from "invariant";
import { log } from "@ledgerhq/logs";
import {
  listAppCandidates,
  createSpeculosDevice,
  releaseSpeculosDevice,
  findLatestAppCandidate,
  SpeculosTransport,
} from "../load/speculos";
import { SpeculosDevice } from "@ledgerhq/speculos-transport";
import type { AppCandidate } from "@ledgerhq/coin-framework/bot/types";
import { DeviceModelId } from "@ledgerhq/devices";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import axios from "axios";
import { getEnv } from "@ledgerhq/live-env";
import { getCryptoCurrencyById } from "../currencies";
import { DeviceLabels } from "../e2e/enum/DeviceLabels";
import { Account } from "./enum/Account";
import { Currency } from "./enum/Currency";
import expect from "expect";

export type Spec = {
  currency?: CryptoCurrency;
  appQuery: {
    model: DeviceModelId;
    appName: string;
  };
  /** @deprecated */
  dependency?: string;
  dependencies?: Dependency[];
  onSpeculosDeviceCreated?: (device: Device) => Promise<void>;
};

export type Dependency = { name: string; appVersion?: string };

export function setExchangeDependencies(dependencies: Dependency[]) {
  const map = new Map<string, Dependency>();
  for (const dep of dependencies) {
    if (!map.has(dep.name)) {
      map.set(dep.name, dep);
    }
  }
  specs["Exchange"].dependencies = Array.from(map.values());
}

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
    },
    dependency: "",
  },
  Exchange: {
    appQuery: {
      model: DeviceModelId.nanoSP,
      appName: "Exchange",
    },
    dependencies: [],
  },
  LedgerSync: {
    appQuery: {
      model: DeviceModelId.nanoX,
      appName: "Ledger Sync",
    },
    dependency: "",
  },
  Dogecoin: {
    currency: getCryptoCurrencyById("dogecoin"),
    appQuery: {
      model: DeviceModelId.nanoSP,
      appName: "Dogecoin",
    },
    dependency: "",
  },
  Ethereum: {
    currency: getCryptoCurrencyById("ethereum"),
    appQuery: {
      model: DeviceModelId.nanoSP,
      appName: "Ethereum",
    },
    dependency: "",
  },
  Ethereum_Holesky: {
    currency: getCryptoCurrencyById("ethereum_holesky"),
    appQuery: {
      model: DeviceModelId.nanoSP,
      appName: "Ethereum",
    },
    dependency: "",
  },
  Ethereum_Sepolia: {
    currency: getCryptoCurrencyById("ethereum_sepolia"),
    appQuery: {
      model: DeviceModelId.nanoSP,
      appName: "Ethereum",
    },
    dependency: "",
  },
  Ethereum_Classic: {
    currency: getCryptoCurrencyById("ethereum_classic"),
    appQuery: {
      model: DeviceModelId.nanoSP,
      appName: "Ethereum Classic",
    },
    dependency: "Ethereum",
  },
  Bitcoin_Testnet: {
    currency: getCryptoCurrencyById("bitcoin_testnet"),
    appQuery: {
      model: DeviceModelId.nanoSP,
      appName: "Bitcoin Test",
    },
    dependency: "",
  },
  Solana: {
    currency: getCryptoCurrencyById("solana"),
    appQuery: {
      model: DeviceModelId.nanoSP,
      appName: "Solana",
    },
    dependency: "",
  },
  Cardano: {
    currency: getCryptoCurrencyById("cardano"),
    appQuery: {
      model: DeviceModelId.nanoSP,
      appName: "CardanoADA",
    },
    dependency: "",
  },
  Polkadot: {
    currency: getCryptoCurrencyById("polkadot"),
    appQuery: {
      model: DeviceModelId.nanoSP,
      appName: "Polkadot",
    },
    dependency: "",
  },
  Tron: {
    currency: getCryptoCurrencyById("tron"),
    appQuery: {
      model: DeviceModelId.nanoSP,
      appName: "Tron",
    },
    dependency: "",
  },
  Ripple: {
    currency: getCryptoCurrencyById("ripple"),
    appQuery: {
      model: DeviceModelId.nanoSP,
      appName: "XRP",
    },
    dependency: "",
  },
  Stellar: {
    currency: getCryptoCurrencyById("stellar"),
    appQuery: {
      model: DeviceModelId.nanoSP,
      appName: "Stellar",
    },
    dependency: "",
  },
  Bitcoin_Cash: {
    currency: getCryptoCurrencyById("bitcoin_cash"),
    appQuery: {
      model: DeviceModelId.nanoSP,
      appName: "Bitcoin Cash",
    },
    dependency: "",
  },
  Algorand: {
    currency: getCryptoCurrencyById("algorand"),
    appQuery: {
      model: DeviceModelId.nanoSP,
      appName: "Algorand",
    },
    dependency: "",
  },
  Cosmos: {
    currency: getCryptoCurrencyById("cosmos"),
    appQuery: {
      model: DeviceModelId.nanoSP,
      appName: "Cosmos",
    },
    dependency: "",
  },
  Tezos: {
    currency: getCryptoCurrencyById("tezos"),
    appQuery: {
      model: DeviceModelId.nanoSP,
      appName: "TezosWallet",
    },
    dependency: "",
  },
  Polygon: {
    currency: getCryptoCurrencyById("polygon"),
    appQuery: {
      model: DeviceModelId.nanoSP,
      appName: "Polygon",
    },
    dependency: "",
  },
  Binance_Smart_Chain: {
    currency: getCryptoCurrencyById("bsc"),
    appQuery: {
      model: DeviceModelId.nanoSP,
      appName: "Binance Smart Chain",
    },
    dependency: "",
  },
  Ton: {
    currency: getCryptoCurrencyById("ton"),
    appQuery: {
      model: DeviceModelId.nanoSP,
      appName: "TON",
    },
    dependency: "",
  },
  Near: {
    currency: getCryptoCurrencyById("near"),
    appQuery: {
      model: DeviceModelId.nanoSP,
      appName: "NEAR",
    },
    dependency: "",
  },
  Multiverse_X: {
    currency: getCryptoCurrencyById("elrond"),
    appQuery: {
      model: DeviceModelId.nanoSP,
      appName: "MultiversX",
    },
    dependency: "",
  },
  Osmosis: {
    currency: getCryptoCurrencyById("osmo"),
    appQuery: {
      model: DeviceModelId.nanoSP,
      appName: "Cosmos",
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
  const appCandidate = findLatestAppCandidate(appCandidates, appQuery);
  const { model } = appQuery;
  const { dependencies } = spec;
  const newAppQuery = dependencies?.map(dep => {
    return findLatestAppCandidate(appCandidates, { model, appName: dep.name });
  });
  const appVersionMap = new Map(newAppQuery?.map(app => [app?.appName, app?.appVersion]));
  dependencies?.forEach(dependency => {
    dependency.appVersion = appVersionMap.get(dependency.name) || "1.0.0";
  });
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
    appName: spec.currency ? spec.currency.managerAppName : spec.appQuery.appName,
    seed,
    dependency,
    dependencies,
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

export async function pressUntilTextFound(
  targetText: string,
  maxAttempts: number = 15,
): Promise<string[]> {
  const speculosApiPort = getEnv("SPECULOS_API_PORT");

  for (let attempts = 0; attempts < maxAttempts; attempts++) {
    const texts = await fetchCurrentScreenTexts(speculosApiPort);

    if (texts.includes(targetText)) {
      return await fetchAllEvents(speculosApiPort);
    }

    await pressRightButton(speculosApiPort);
    await waitForTimeOut(200);
  }

  throw new Error(
    `ElementNotFoundException: Element with text "${targetText}" not found on speculos screen`,
  );
}

async function fetchCurrentScreenTexts(speculosApiPort: number): Promise<string> {
  const response = await axios.get<ResponseData>(
    `http://127.0.0.1:${speculosApiPort}/events?stream=false&currentscreenonly=true`,
  );
  return response.data.events.map(event => event.text).join("");
}

async function fetchAllEvents(speculosApiPort: number): Promise<string[]> {
  const response = await axios.get<ResponseData>(
    `http://127.0.0.1:${speculosApiPort}/events?stream=false&currentscreenonly=false`,
  );
  return response.data.events.map(event => event.text);
}

async function pressRightButton(speculosApiPort: number): Promise<void> {
  await axios.post(`http://127.0.0.1:${speculosApiPort}/button/right`, {
    action: "press-and-release",
  });
}

export function containsSubstringInEvent(targetString: string, events: string[]): boolean {
  const concatenatedEvents = events.join("");

  let result = concatenatedEvents.includes(targetString);

  if (!result) {
    const regexPattern = targetString.split("").join(".*?");
    const regex = new RegExp(regexPattern, "s");
    result = regex.test(concatenatedEvents);
  }

  return result;
}

export async function takeScreenshot() {
  const speculosApiPort = getEnv("SPECULOS_API_PORT");
  try {
    const response = await axios.get(`http://127.0.0.1:${speculosApiPort}/screenshot`, {
      responseType: "arraybuffer",
    });
    return response.data;
  } catch (error) {
    console.error("Error downloading speculos screenshot:", error);
    throw error;
  }
}

export async function waitForTimeOut(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function activateLedgerSync() {
  await waitFor(DeviceLabels.CONNECT_WITH);
  await pressUntilTextFound(DeviceLabels.MAKE_SURE_TO_USE);
  await pressUntilTextFound(DeviceLabels.CONNECT_WITH);
  await pressBoth();
  await waitFor(DeviceLabels.TURN_ON_SYNC);
  await pressUntilTextFound(DeviceLabels.YOUR_CRYPTO_ACCOUNTS);
  await pressUntilTextFound(DeviceLabels.TURN_ON_SYNC);
  await pressBoth();
}

export async function expectValidAddressDevice(account: Account, addressDisplayed: string) {
  let deviceLabels: string[];

  switch (account.currency) {
    case Currency.SOL:
      deviceLabels = [DeviceLabels.PUBKEY, DeviceLabels.APPROVE, DeviceLabels.REJECT];
      break;
    case Currency.DOT:
    case Currency.ATOM:
      deviceLabels = [DeviceLabels.ADDRESS, DeviceLabels.CAPS_APPROVE, DeviceLabels.CAPS_REJECT];
      break;
    default:
      deviceLabels = [DeviceLabels.ADDRESS, DeviceLabels.APPROVE, DeviceLabels.REJECT];
      break;
  }

  await waitFor(deviceLabels[0]);
  const events = await pressUntilTextFound(deviceLabels[1]);
  const isAddressCorrect = containsSubstringInEvent(addressDisplayed, events);
  expect(isAddressCorrect).toBeTruthy();
  await pressBoth();
}
