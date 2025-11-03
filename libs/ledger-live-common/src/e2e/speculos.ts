import invariant from "invariant";
import { log } from "@ledgerhq/logs";
import {
  createSpeculosDevice,
  findLatestAppCandidate,
  listAppCandidates,
  releaseSpeculosDevice,
  SpeculosTransport,
} from "../load/speculos";
import { createSpeculosDeviceCI, releaseSpeculosDeviceCI } from "./speculosCI";
import type { AppCandidate } from "@ledgerhq/coin-framework/bot/types";
import { DeviceModelId } from "@ledgerhq/devices";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import axios, { AxiosError, AxiosResponse } from "axios";
import { getEnv } from "@ledgerhq/live-env";
import { getCryptoCurrencyById } from "../currencies";
import { DeviceLabels } from "./enum/DeviceLabels";
import { Account } from "./enum/Account";
import { Currency } from "./enum/Currency";
import expect from "expect";
import { sendBTC, sendBTCBasedCoin } from "./families/bitcoin";
import { sendEVM } from "./families/evm";
import { sendPolkadot } from "./families/polkadot";
import { sendAlgorand } from "./families/algorand";
import { sendTron } from "./families/tron";
import { sendStellar } from "./families/stellar";
import { delegateCardano, sendCardano } from "./families/cardano";
import { sendXRP } from "./families/xrp";
import { delegateAptos, sendAptos } from "./families/aptos";
import { sendHedera } from "./families/hedera";
import { delegateNear } from "./families/near";
import { delegateCosmos, sendCosmos } from "./families/cosmos";
import { sendKaspa } from "./families/kaspa";
import { delegateSolana, sendSolana } from "./families/solana";
import { delegateTezos } from "./families/tezos";
import { delegateCelo } from "./families/celo";
import { delegateMultiversX } from "./families/multiversX";
import { Transaction } from "./models/Transaction";
import { Delegate } from "./models/Delegate";
import { Swap } from "./models/Swap";
import { delegateOsmosis } from "./families/osmosis";
import { AppInfos } from "./enum/AppInfos";
import { DEVICE_LABELS_CONFIG } from "./data/deviceLabelsData";
import { sendSui } from "./families/sui";
import { getAppVersionFromCatalog, getSpeculosModel, isTouchDevice } from "./speculosAppVersion";
import {
  pressAndRelease,
  longPressAndRelease,
  swipeRight,
} from "./deviceInteraction/TouchDeviceSimulator";
import { pressBoth, pressRightButton } from "./deviceInteraction/ButtonDeviceSimulator";

const isSpeculosRemote = process.env.REMOTE_SPECULOS === "true";

export type Spec = {
  currency?: CryptoCurrency;
  appQuery: {
    model: DeviceModelId;
    appName: string;
    appVersion?: string;
  };
  /** @deprecated */
  dependency?: string;
  dependencies?: Dependency[];
  onSpeculosDeviceCreated?: (device: Device) => Promise<void>;
};

export type Dependency = { name: string; appVersion?: string };
export type SpeculosDevice = {
  id: string;
  port: number;
  appName?: string;
  appVersion?: string;
};

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
      model: getSpeculosModel(),
      appName: "Bitcoin",
    },
    dependency: "",
  },
  Aptos: {
    currency: getCryptoCurrencyById("aptos"),
    appQuery: {
      model: getSpeculosModel(),
      appName: "Aptos",
    },
    dependency: "",
  },
  Exchange: {
    appQuery: {
      model: getSpeculosModel(),
      appName: "Exchange",
    },
    dependencies: [],
  },
  LedgerSync: {
    appQuery: {
      model: getSpeculosModel(),
      appName: "Ledger Sync",
    },
    dependency: "",
  },
  Dogecoin: {
    currency: getCryptoCurrencyById("dogecoin"),
    appQuery: {
      model: getSpeculosModel(),
      appName: "Dogecoin",
    },
    dependency: "",
  },
  Ethereum: {
    currency: getCryptoCurrencyById("ethereum"),
    appQuery: {
      model: getSpeculosModel(),
      appName: "Ethereum",
    },
    dependency: "",
  },
  Ethereum_Holesky: {
    currency: getCryptoCurrencyById("ethereum_holesky"),
    appQuery: {
      model: getSpeculosModel(),
      appName: "Ethereum",
    },
    dependency: "",
  },
  Ethereum_Sepolia: {
    currency: getCryptoCurrencyById("ethereum_sepolia"),
    appQuery: {
      model: getSpeculosModel(),
      appName: "Ethereum",
    },
    dependency: "",
  },
  Ethereum_Classic: {
    currency: getCryptoCurrencyById("ethereum_classic"),
    appQuery: {
      model: getSpeculosModel(),
      appName: "Ethereum Classic",
    },
    dependency: "Ethereum",
  },
  Bitcoin_Testnet: {
    currency: getCryptoCurrencyById("bitcoin_testnet"),
    appQuery: {
      model: getSpeculosModel(),
      appName: "Bitcoin Test",
    },
    dependency: "",
  },
  Solana: {
    currency: getCryptoCurrencyById("solana"),
    appQuery: {
      model: getSpeculosModel(),
      appName: "Solana",
    },
    dependency: "",
  },
  Cardano: {
    currency: getCryptoCurrencyById("cardano"),
    appQuery: {
      model: getSpeculosModel(),
      appName: "CardanoADA",
    },
    dependency: "",
  },
  Polkadot: {
    currency: getCryptoCurrencyById("polkadot"),
    appQuery: {
      model: getSpeculosModel(),
      appName: "Polkadot",
    },
    dependency: "",
  },
  Tron: {
    currency: getCryptoCurrencyById("tron"),
    appQuery: {
      model: getSpeculosModel(),
      appName: "Tron",
    },
    dependency: "",
  },
  XRP: {
    currency: getCryptoCurrencyById("ripple"),
    appQuery: {
      model: getSpeculosModel(),
      appName: "XRP",
    },
    dependency: "",
  },
  Stellar: {
    currency: getCryptoCurrencyById("stellar"),
    appQuery: {
      model: getSpeculosModel(),
      appName: "Stellar",
    },
    dependency: "",
  },
  Bitcoin_Cash: {
    currency: getCryptoCurrencyById("bitcoin_cash"),
    appQuery: {
      model: getSpeculosModel(),
      appName: "Bitcoin Cash",
    },
    dependency: "",
  },
  Algorand: {
    currency: getCryptoCurrencyById("algorand"),
    appQuery: {
      model: getSpeculosModel(),
      appName: "Algorand",
    },
    dependency: "",
  },
  Cosmos: {
    currency: getCryptoCurrencyById("cosmos"),
    appQuery: {
      model: getSpeculosModel(),
      appName: "Cosmos",
    },
    dependency: "",
  },
  Tezos: {
    currency: getCryptoCurrencyById("tezos"),
    appQuery: {
      model: getSpeculosModel(),
      appName: "TezosWallet",
    },
    dependency: "",
  },
  Polygon: {
    currency: getCryptoCurrencyById("polygon"),
    appQuery: {
      model: getSpeculosModel(),
      appName: "Ethereum",
    },
    dependency: "",
  },
  BNB_Chain: {
    currency: getCryptoCurrencyById("bsc"),
    appQuery: {
      model: getSpeculosModel(),
      appName: "Ethereum",
    },
    dependency: "",
  },
  Ton: {
    currency: getCryptoCurrencyById("ton"),
    appQuery: {
      model: getSpeculosModel(),
      appName: "TON",
    },
    dependency: "",
  },
  Near: {
    currency: getCryptoCurrencyById("near"),
    appQuery: {
      model: getSpeculosModel(),
      appName: "NEAR",
    },
    dependency: "",
  },
  Multivers_X: {
    currency: getCryptoCurrencyById("elrond"),
    appQuery: {
      model: getSpeculosModel(),
      appName: "MultiversX",
    },
    dependency: "",
  },
  Osmosis: {
    currency: getCryptoCurrencyById("osmo"),
    appQuery: {
      model: getSpeculosModel(),
      appName: "Cosmos",
    },
    dependency: "",
  },
  Injective: {
    currency: getCryptoCurrencyById("injective"),
    appQuery: {
      model: getSpeculosModel(),
      appName: "Cosmos",
    },
    dependency: "",
  },
  Celo: {
    currency: getCryptoCurrencyById("celo"),
    appQuery: {
      model: getSpeculosModel(),
      appName: "Celo",
    },
    dependency: "",
  },
  Litecoin: {
    currency: getCryptoCurrencyById("litecoin"),
    appQuery: {
      model: getSpeculosModel(),
      appName: "Litecoin",
    },
    dependency: "",
  },
  Kaspa: {
    currency: getCryptoCurrencyById("kaspa"),
    appQuery: {
      model: getSpeculosModel(),
      appName: "Kaspa",
    },
    dependency: "",
  },
  Hedera: {
    currency: getCryptoCurrencyById("hedera"),
    appQuery: {
      model: getSpeculosModel(),
      appName: "Hedera",
    },
    dependency: "",
  },
  Sui: {
    currency: getCryptoCurrencyById("sui"),
    appQuery: {
      model: getSpeculosModel(),
      appName: "Sui",
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
  const appCandidates = await listAppCandidates(coinapps);

  const nanoAppCatalogPath = getEnv("E2E_NANO_APP_VERSION_PATH");

  const { appQuery, dependency, onSpeculosDeviceCreated } = spec;
  try {
    const displayName = spec.currency?.managerAppName || appQuery.appName;
    const catalogVersion = await getAppVersionFromCatalog(displayName, nanoAppCatalogPath);
    if (catalogVersion) {
      appQuery.appVersion = catalogVersion;
    }
  } catch (e) {
    console.warn("[speculos] Unable to fetch app version from catalog", e);
  }

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
    return isSpeculosRemote
      ? await createSpeculosDeviceCI(deviceParams)
      : await createSpeculosDevice(deviceParams).then(device => {
          invariant(device.ports.apiPort, "[E2E] Speculos apiPort is not defined");
          return {
            id: device.id,
            port: device.ports.apiPort,
            appName: appCandidate.appName,
            appVersion: appCandidate.appVersion,
          };
        });
  } catch (e: unknown) {
    console.error(e);
    log("engine", `test ${testName} failed with ${String(e)}`);
  }
}

export async function stopSpeculos(deviceId: string | undefined) {
  if (deviceId) {
    log("engine", `test ${deviceId} finished`);
    isSpeculosRemote
      ? await releaseSpeculosDeviceCI(deviceId)
      : await releaseSpeculosDevice(deviceId);
  }
}

interface Event {
  text: string;
  x: number;
  y: number;
}

interface ResponseData {
  events: Event[];
}

export function getSpeculosAddress(): string {
  const speculosAddress = process.env.SPECULOS_ADDRESS;
  return speculosAddress || "http://127.0.0.1";
}

export async function retryAxiosRequest<T>(
  requestFn: () => Promise<AxiosResponse<T>>,
  maxRetries: number = 5,
  baseDelay: number = 1000,
  retryableStatusCodes: number[] = [500, 502, 503, 504],
): Promise<AxiosResponse<T>> {
  let lastError: AxiosError | Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error as AxiosError | Error;

      const isRetryable =
        axios.isAxiosError(error) &&
        error.response &&
        retryableStatusCodes.includes(error.response.status);

      const isNetworkError = axios.isAxiosError(error) && !error.response;

      if ((isRetryable || isNetworkError) && attempt < maxRetries) {
        const delay = baseDelay * (attempt + 1);
        console.warn(
          `Axios request failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms...`,
          {
            status: axios.isAxiosError(error) ? error.response?.status : "network error",
            message: error.message,
          },
        );
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      throw lastError;
    }
  }

  throw lastError!;
}

export async function waitFor(text: string, maxAttempts = 60): Promise<string> {
  const port = getEnv("SPECULOS_API_PORT");
  let texts = "";
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    texts = await fetchCurrentScreenTexts(port);

    if (texts.toLowerCase().includes(text.toLowerCase())) {
      return texts;
    }

    await waitForTimeOut(500);
  }

  throw new Error(
    `Text "${text}" not found on device screen after ${maxAttempts} attempts. Last screen text: "${texts}"`,
  );
}

export async function fetchCurrentScreenTexts(speculosApiPort: number): Promise<string> {
  const speculosAddress = getSpeculosAddress();
  const response = await retryAxiosRequest(() =>
    axios.get<ResponseData>(
      `${speculosAddress}:${speculosApiPort}/events?stream=false&currentscreenonly=true`,
    ),
  );
  return response.data.events.map(event => event.text).join(" ");
}

export async function getDeviceLabelCoordinates(
  label: string,
  speculosApiPort: number,
): Promise<{ x: number; y: number }> {
  const speculosAddress = getSpeculosAddress();
  const response = await retryAxiosRequest(() =>
    axios.get<ResponseData>(
      `${speculosAddress}:${speculosApiPort}/events?stream=false&currentscreenonly=true`,
    ),
  );
  const event = response.data.events.find(e => e.text === label);

  if (!event) {
    throw new Error(`Label "${label}" not found in screen events`);
  }

  return { x: event.x, y: event.y };
}

export async function fetchAllEvents(speculosApiPort: number): Promise<string[]> {
  const speculosAddress = getSpeculosAddress();
  const response = await retryAxiosRequest(() =>
    axios.get<ResponseData>(
      `${speculosAddress}:${speculosApiPort}/events?stream=false&currentscreenonly=false`,
    ),
  );
  return response.data.events.map(event => event.text);
}

export async function pressUntilTextFound(
  targetText: string,
  strictMatch: boolean = false,
): Promise<string[]> {
  const maxAttempts = 18;
  const speculosApiPort = getEnv("SPECULOS_API_PORT");

  for (let attempts = 0; attempts < maxAttempts; attempts++) {
    const texts = await fetchCurrentScreenTexts(speculosApiPort);
    if (
      strictMatch ? texts === targetText : texts.toLowerCase().includes(targetText.toLowerCase())
    ) {
      return await fetchAllEvents(speculosApiPort);
    }
    if (isTouchDevice()) {
      await swipeRight();
    } else {
      await pressRightButton();
    }
    await waitForTimeOut(200);
  }

  throw new Error(
    `ElementNotFoundException: Element with text "${targetText}" not found on speculos screen`,
  );
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
  const speculosAddress = getSpeculosAddress();
  const speculosApiPort = port ?? getEnv("SPECULOS_API_PORT");
  try {
    const response = await retryAxiosRequest(() =>
      axios.get(`${speculosAddress}:${speculosApiPort}/screenshot`, {
        responseType: "arraybuffer",
      }),
    );
    return response.data;
  } catch (error) {
    console.error("Error downloading speculos screenshot:", error);
  }
}

export async function waitForTimeOut(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function removeMemberLedgerSync() {
  await waitFor(DeviceLabels.CONNECT_WITH);
  if (isTouchDevice()) {
    await pressAndRelease(DeviceLabels.CONNECT);
    await waitFor(DeviceLabels.REMOVE_FROM_LEDGER_SYNC);
    await pressAndRelease(DeviceLabels.REMOVE);
    await waitFor(DeviceLabels.CONFIRM_CHANGE);
    await pressAndRelease(DeviceLabels.TAP_TO_CONTINUE);
    await waitFor(DeviceLabels.TURN_ON_SYNC);
    await pressUntilTextFound(DeviceLabels.LEDGER_LIVE_WILL_BE);
    await pressUntilTextFound(DeviceLabels.TURN_ON_SYNC);
    await pressAndRelease(DeviceLabels.TURN_ON_SYNC);
  } else {
    await pressUntilTextFound(DeviceLabels.CONNECT_WITH_LEDGER_SYNC, true);
    await pressBoth();
    await waitFor(DeviceLabels.REMOVE_PHONE_OR_COMPUTER);
    await pressUntilTextFound(DeviceLabels.REMOVE_PHONE_OR_COMPUTER, true);
    await pressBoth();
    await waitFor(DeviceLabels.TURN_ON_SYNC);
    await pressUntilTextFound(DeviceLabels.LEDGER_LIVE_WILL_BE);
    await pressUntilTextFound(DeviceLabels.TURN_ON_SYNC);
    await pressBoth();
  }
}

export async function activateLedgerSync() {
  await waitFor(DeviceLabels.CONNECT_WITH);
  if (isTouchDevice()) {
    await pressAndRelease(DeviceLabels.CONNECT_WITH_LEDGER_SYNC);
  } else {
    await pressUntilTextFound(DeviceLabels.CONNECT_WITH_LEDGER_SYNC, true);
    await pressBoth();
  }
  await waitFor(DeviceLabels.TURN_ON_SYNC);
  if (isTouchDevice()) {
    await pressAndRelease(DeviceLabels.TURN_ON_SYNC);
  } else {
    await pressUntilTextFound(DeviceLabels.LEDGER_LIVE_WILL_BE);
    await pressUntilTextFound(DeviceLabels.TURN_ON_SYNC);
    await pressBoth();
  }
}

export async function activateExpertMode() {
  if (isTouchDevice()) {
    await goToSettings();
    const SettingsToggle1Coordinates = { x: 344, y: 136 };
    await pressAndRelease(
      DeviceLabels.SETTINGS_TOGGLE_1,
      SettingsToggle1Coordinates.x,
      SettingsToggle1Coordinates.y,
    );
  } else {
    await pressUntilTextFound(DeviceLabels.EXPERT_MODE);
    await pressBoth();
  }
}

export async function activateContractData() {
  await pressUntilTextFound(DeviceLabels.SETTINGS);
  await pressBoth();
  await waitFor(DeviceLabels.CONTRACT_DATA);
  await pressBoth();
}

export async function goToSettings() {
  if (isTouchDevice()) {
    const SettingsCogwheelCoordinates = { x: 400, y: 75 };
    await pressAndRelease(
      DeviceLabels.SETTINGS,
      SettingsCogwheelCoordinates.x,
      SettingsCogwheelCoordinates.y,
    );
  } else {
    await pressUntilTextFound(DeviceLabels.SETTINGS);
    await pressBoth();
  }
}

export async function providePublicKey() {
  await pressRightButton();
}

type DeviceLabelsReturn = {
  delegateConfirmLabel: string;
  delegateVerifyLabel: string;
  receiveConfirmLabel: string;
  receiveVerifyLabel: string;
  sendVerifyLabel: string;
  sendConfirmLabel: string;
};

export function getDeviceLabels(appInfo: AppInfos): DeviceLabelsReturn {
  const deviceModel = getSpeculosModel();
  const deviceConfig = DEVICE_LABELS_CONFIG[deviceModel] ?? DEVICE_LABELS_CONFIG.default;

  if (!deviceConfig) {
    throw new Error(`No device configuration found for ${deviceModel}`);
  }

  const receiveVerifyLabel =
    deviceConfig.receiveVerify[appInfo.name] ?? deviceConfig.receiveVerify.default;
  const receiveConfirmLabel =
    deviceConfig.receiveConfirm[appInfo.name] ?? deviceConfig.receiveConfirm.default;
  const delegateVerifyLabel =
    deviceConfig.delegateVerify[appInfo.name] ?? deviceConfig.delegateVerify.default;
  const delegateConfirmLabel =
    deviceConfig.delegateConfirm[appInfo.name] ?? deviceConfig.delegateConfirm.default;
  const sendVerifyLabel = deviceConfig.sendVerify[appInfo.name] ?? deviceConfig.sendVerify.default;
  const sendConfirmLabel =
    deviceConfig.sendConfirm[appInfo.name] ?? deviceConfig.sendConfirm.default;

  return {
    receiveVerifyLabel,
    receiveConfirmLabel,
    delegateVerifyLabel,
    delegateConfirmLabel,
    sendVerifyLabel,
    sendConfirmLabel,
  };
}

export async function expectValidAddressDevice(account: Account, addressDisplayed: string) {
  if (account.currency === Currency.SUI_USDC) {
    providePublicKey();
  }
  const { receiveVerifyLabel, receiveConfirmLabel } = getDeviceLabels(account.currency.speculosApp);
  await waitFor(receiveVerifyLabel);
  if (isTouchDevice()) {
    const events = await pressUntilTextFound(receiveConfirmLabel);
    const isAddressCorrect = containsSubstringInEvent(addressDisplayed, events);
    expect(isAddressCorrect).toBeTruthy();
    await pressAndRelease(DeviceLabels.CONFIRM);
  } else {
    const { receiveVerifyLabel, receiveConfirmLabel } = getDeviceLabels(
      account.currency.speculosApp,
    );
    await waitFor(receiveVerifyLabel);
    const events = await pressUntilTextFound(receiveConfirmLabel);
    const isAddressCorrect = containsSubstringInEvent(addressDisplayed, events);
    expect(isAddressCorrect).toBeTruthy();
    await pressBoth();
  }
}

export async function signSendTransaction(tx: Transaction) {
  const currencyName = tx.accountToDebit.currency;
  switch (currencyName) {
    case Currency.sepETH:
    case Currency.POL:
    case Currency.ETH:
      await sendEVM(tx);
      break;
    case Currency.BTC:
      await sendBTC(tx);
      break;
    case Currency.ETH_USDT:
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
      await sendAptos(tx);
      break;
    case Currency.KAS:
      await sendKaspa(tx);
      break;
    case Currency.HBAR:
      await sendHedera();
      break;
    case Currency.SUI:
    case Currency.SUI_USDC:
      await sendSui(tx);
      break;
    default:
      throw new Error(`Unsupported currency: ${currencyName.ticker}`);
  }
}

export async function getSendEvents(tx: Transaction): Promise<string[]> {
  const { sendVerifyLabel, sendConfirmLabel } = getDeviceLabels(
    tx.accountToDebit.currency.speculosApp,
  );
  await waitFor(sendVerifyLabel);
  return await pressUntilTextFound(sendConfirmLabel);
}

export async function signDelegationTransaction(delegatingAccount: Delegate) {
  const currencyName = delegatingAccount.account.currency.name;
  switch (currencyName) {
    case Account.SOL_1.currency.name:
      await delegateSolana(delegatingAccount);
      break;
    case Account.NEAR_1.currency.name:
      await delegateNear(delegatingAccount);
      break;
    case Account.ATOM_1.currency.name:
    case Account.INJ_1.currency.name:
      await delegateCosmos(delegatingAccount);
      break;
    case Account.OSMO_1.currency.name:
      await delegateOsmosis(delegatingAccount);
      break;
    case Account.MULTIVERS_X_1.currency.name:
      await delegateMultiversX(delegatingAccount);
      break;
    case Account.ADA_1.currency.name:
      await delegateCardano();
      break;
    case Account.XTZ_1.currency.name:
      await delegateTezos(delegatingAccount);
      break;
    case Account.CELO_1.currency.name:
      await delegateCelo(delegatingAccount);
      break;
    case Account.APTOS_1.currency.name:
      await delegateAptos(delegatingAccount);
      break;
    default:
      throw new Error(`Unsupported currency: ${currencyName}`);
  }
}

export async function getDelegateEvents(delegatingAccount: Delegate): Promise<string[]> {
  const { delegateVerifyLabel, delegateConfirmLabel } = getDeviceLabels(
    delegatingAccount.account.currency.speculosApp,
  );
  await waitFor(delegateVerifyLabel);
  return await pressUntilTextFound(delegateConfirmLabel);
}

export async function verifyAmountsAndAcceptSwap(swap: Swap, amount: string) {
  await waitFor(DeviceLabels.REVIEW_TRANSACTION);
  const events =
    getSpeculosModel() === DeviceModelId.nanoS
      ? await pressUntilTextFound(DeviceLabels.ACCEPT_AND_SEND)
      : await pressUntilTextFound(DeviceLabels.SIGN_TRANSACTION);
  verifySwapData(swap, events, amount);
  if (isTouchDevice()) {
    await longPressAndRelease(DeviceLabels.HOLD_TO_SIGN, 3);
  } else {
    await pressBoth();
  }
}

export async function verifyAmountsAndAcceptSwapForDifferentSeed(
  swap: Swap,
  amount: string,
  errorMessage: string | null,
) {
  if (errorMessage === null && isTouchDevice()) {
    await waitFor(DeviceLabels.RECEIVE_ADDRESS_DOES_NOT_BELONG);
    await pressAndRelease(DeviceLabels.CONTINUE_ANYWAY);
  } else {
    await waitFor(DeviceLabels.REVIEW_TRANSACTION);
  }
  const events = await pressUntilTextFound(DeviceLabels.SIGN_TRANSACTION);
  verifySwapData(swap, events, amount);
  if (isTouchDevice()) {
    await longPressAndRelease(DeviceLabels.HOLD_TO_SIGN, 3);
  } else {
    await pressBoth();
  }
}

export async function verifyAmountsAndRejectSwap(swap: Swap, amount: string) {
  await waitFor(DeviceLabels.REVIEW_TRANSACTION);
  let events: string[] = [];
  if (isTouchDevice()) {
    events = await pressUntilTextFound(DeviceLabels.HOLD_TO_SIGN);
  } else {
    events = await pressUntilTextFound(DeviceLabels.REJECT);
  }

  verifySwapData(swap, events, amount);
  if (isTouchDevice()) {
    await pressAndRelease(DeviceLabels.REJECT);
    await waitFor(DeviceLabels.YES_REJECT);
    await pressAndRelease(DeviceLabels.YES_REJECT);
  } else {
    await pressBoth();
  }
}

function verifySwapData(swap: Swap, events: string[], amount: string) {
  const swapPair = `swap ${swap.getAccountToDebit.currency.ticker} to ${swap.getAccountToCredit.currency.ticker}`;

  if (getSpeculosModel() !== DeviceModelId.nanoS) {
    expectDeviceScreenContains(swapPair, events, "Swap pair not found on the device screen");
  }
  expectDeviceScreenContains(amount, events, `Amount ${amount} not found on the device screen`);
}

function expectDeviceScreenContains(substring: string, events: string[], message: string) {
  const found = containsSubstringInEvent(substring, events);
  if (!found) {
    throw new Error(
      `${message}. Expected events to contain "${substring}". Got: ${JSON.stringify(events)}`,
    );
  }
}
