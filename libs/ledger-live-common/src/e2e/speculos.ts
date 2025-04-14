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
import { sendBTCBasedCoin } from "./families/bitcoin";
import { sendEVM, sendEvmNFT } from ".//families/evm";
import { sendPolkadot } from "./families/polkadot";
import { sendAlgorand } from "./families/algorand";
import { sendTron } from "./families/tron";
import { sendStellar } from "./families/stellar";
import { sendCardano, delegateCardano } from "./families/cardano";
import { sendXRP } from "./families/xrp";
import { sendAptos } from "./families/aptos";
import { delegateNear } from "./families/near";
import { delegateCosmos, sendCosmos } from "./families/cosmos";
import { delegateSolana, sendSolana } from "./families/solana";
import { delegateTezos } from "./families/tezos";
import { delegateCelo } from "./families/celo";
import { delegateMultiversX } from "./families/multiversX";
import { NFTTransaction, Transaction } from "./models/Transaction";
import { Delegate } from "./models/Delegate";
import { Swap } from "./models/Swap";

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
  Aptos: {
    currency: getCryptoCurrencyById("aptos"),
    appQuery: {
      model: DeviceModelId.nanoSP,
      appName: "Aptos",
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
  XRP: {
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
      appName: "Ethereum",
    },
    dependency: "",
  },
  Binance_Smart_Chain: {
    currency: getCryptoCurrencyById("bsc"),
    appQuery: {
      model: DeviceModelId.nanoSP,
      appName: "Ethereum",
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
  Multivers_X: {
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
  Injective: {
    currency: getCryptoCurrencyById("injective"),
    appQuery: {
      model: DeviceModelId.nanoSP,
      appName: "Cosmos",
    },
    dependency: "",
  },

  Celo: {
    currency: getCryptoCurrencyById("celo"),
    appQuery: {
      model: DeviceModelId.nanoSP,
      appName: "Celo",
    },
    dependency: "",
  },
  Litecoin: {
    currency: getCryptoCurrencyById("litecoin"),
    appQuery: {
      model: DeviceModelId.nanoSP,
      appName: "Litecoin",
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
    return findLatestAppCandidate(appCandidates, {
      model,
      appName: dep.name,
      firmware: appCandidate?.firmware,
    });
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
    console.error(e);
    log("engine", `test ${testName} failed with ${String(e)}`);
  }
}

export async function stopSpeculos(deviceId: string | undefined) {
  if (deviceId) {
    log("engine", `test ${deviceId} finished`);
    await releaseSpeculosDevice(deviceId);
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

    if (texts?.[0]?.includes(text)) {
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

export async function takeScreenshot(port?: number): Promise<Buffer | undefined> {
  const speculosApiPort = port ?? getEnv("SPECULOS_API_PORT");
  try {
    const response = await axios.get(`http://127.0.0.1:${speculosApiPort}/screenshot`, {
      responseType: "arraybuffer",
    });
    return response.data;
  } catch (error) {
    console.error("Error downloading speculos screenshot:", error);
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

export async function activateExpertMode() {
  await pressUntilTextFound(DeviceLabels.EXPERT_MODE);
  await pressBoth();
}

export async function activateContractData() {
  await pressUntilTextFound(DeviceLabels.SETTINGS);
  await pressBoth();
  await waitFor(DeviceLabels.CONTRACT_DATA);
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

export async function signSendTransaction(tx: Transaction) {
  const currencyName = tx.accountToDebit.currency;
  switch (currencyName) {
    case Currency.sepETH:
    case Currency.POL:
    case Currency.ETH:
      await sendEVM(tx);
      break;
    case Currency.DOGE:
    case Currency.BCH:
      await sendBTCBasedCoin(tx);
      break;
    case Currency.DOT:
      await sendPolkadot(tx);
      break;
    case Currency.ALGO:
      await sendAlgorand(tx);
      break;
    case Currency.SOL:
    case Currency.SOL_GIGA:
      await sendSolana(tx);
      break;
    case Currency.TRX:
      await sendTron(tx);
      break;
    case Currency.XLM:
      await sendStellar(tx);
      break;
    case Currency.ATOM:
      await sendCosmos(tx);
      break;
    case Currency.ADA:
      await sendCardano(tx);
      break;
    case Currency.XRP:
      await sendXRP(tx);
      break;
    case Currency.APT:
      await sendAptos();
      break;
    default:
      throw new Error(`Unsupported currency: ${currencyName.ticker}`);
  }
}

export async function signSendNFTTransaction(tx: NFTTransaction) {
  const currencyName = tx.accountToDebit.currency;
  switch (currencyName) {
    case Currency.ETH:
      await sendEvmNFT(tx);
      break;
    default:
      throw new Error(`Unsupported currency: ${currencyName.ticker}`);
  }
}

export async function signDelegationTransaction(delegatingAccount: Delegate) {
  const currencyName = delegatingAccount.account.currency.name;
  switch (currencyName) {
    case Account.SOL_1.currency.name:
      await delegateSolana();
      break;
    case Account.NEAR_1.currency.name:
      await delegateNear(delegatingAccount);
      break;
    case Account.ATOM_1.currency.name:
    case Account.INJ_1.currency.name:
    case Account.OSMO_1.currency.name:
      await delegateCosmos(delegatingAccount);
      break;
    case Account.MULTIVERS_X_1.currency.name:
      await delegateMultiversX();
      break;
    case Account.ADA_1.currency.name:
      await delegateCardano();
      break;
    case Account.XTZ_1.currency.name:
      await delegateTezos();
      break;
    case Account.CELO_1.currency.name:
      await delegateCelo(delegatingAccount);
      break;
    default:
      throw new Error(`Unsupported currency: ${currencyName}`);
  }
}

export async function verifyAmountsAndAcceptSwap(swap: Swap) {
  const events = await pressUntilTextFound(DeviceLabels.ACCEPT);
  await verifySwapData(swap, events);
  await pressBoth();
}

export async function verifyAmountsAndRejectSwap(swap: Swap) {
  const events = await pressUntilTextFound(DeviceLabels.REJECT);
  await verifySwapData(swap, events);
  await pressBoth();
}

async function verifySwapData(swap: Swap, events: string[]) {
  const sendAmountScreen = containsSubstringInEvent(swap.amount, events);
  expect(sendAmountScreen).toBeTruthy();
  verifySwapGetAmountScreen(swap, events);
  verifySwapFeesAmountScreen(swap, events);
}

function verifySwapGetAmountScreen(swap: Swap, events: string[]) {
  const parsedAmountToReceive = extractNumberFromString(swap.amountToReceive);
  swap.amountToReceive =
    parsedAmountToReceive.length < 19
      ? parsedAmountToReceive
      : parsedAmountToReceive.substring(0, 18);

  const receivedGetAmount = containsSubstringInEvent(`${swap.amountToReceive}`, events);
  expect(receivedGetAmount).toBeTruthy();
}

function verifySwapFeesAmountScreen(swap: Swap, events: string[]) {
  const parsedFeesAmount = extractNumberFromString(swap.feesAmount);
  swap.feesAmount =
    parsedFeesAmount.length < 19 ? parsedFeesAmount : parsedFeesAmount.substring(0, 18);

  const receivedFeesAmount = containsSubstringInEvent(swap.feesAmount, events);
  expect(receivedFeesAmount).toBeTruthy();
}

const extractNumberFromString = (input: string | undefined): string => {
  const match = input?.match(/[\d.]+/);
  return match ? match[0] : "";
};
