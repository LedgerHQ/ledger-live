"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signTypedMessage = exports.approveToken = exports.acceptEnableTransactionCheck = exports.shareViewKey = exports.exportUfvk = exports.verifyAmountsAndRejectSwap = exports.verifyAmountsAndAcceptSwapForDifferentSeed = exports.verifyAmountsAndAcceptSwap = exports.expectValidAddressDevice = exports.providePublicKey = exports.goToSettings = exports.activateContractData = exports.activateExpertMode = exports.activateLedgerSync = exports.removeMemberLedgerSync = exports.pressUntilTextFound = exports.specs = void 0;
exports.setExchangeDependencies = setExchangeDependencies;
exports.startSpeculos = startSpeculos;
exports.stopSpeculos = stopSpeculos;
exports.getSpeculosAddress = getSpeculosAddress;
exports.drainSpeculosScreenshots = drainSpeculosScreenshots;
exports.waitFor = waitFor;
exports.waitForReviewTransaction = waitForReviewTransaction;
exports.fetchCurrentScreenTexts = fetchCurrentScreenTexts;
exports.getDeviceLabelCoordinates = getDeviceLabelCoordinates;
exports.fetchAllEvents = fetchAllEvents;
exports.containsSubstringInEvent = containsSubstringInEvent;
exports.takeScreenshot = takeScreenshot;
exports.getDeviceLabels = getDeviceLabels;
exports.signSendTransaction = signSendTransaction;
exports.getSendEvents = getSendEvents;
exports.signDelegationTransaction = signDelegationTransaction;
exports.getDelegateEvents = getDelegateEvents;
const invariant_1 = __importDefault(require("invariant"));
const logs_1 = require("@ledgerhq/logs");
const speculos_1 = require("@ledgerhq/live-common/load/speculos");
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const speculosCI_1 = require("./speculosCI");
const devices_1 = require("@ledgerhq/devices");
const axios_1 = __importDefault(require("axios"));
const live_env_1 = require("@ledgerhq/live-env");
const index_1 = require("@ledgerhq/live-common/currencies/index");
const DeviceLabels_1 = require("./enum/DeviceLabels");
const Account_1 = require("./enum/Account");
const Currency_1 = require("./enum/Currency");
const expect_1 = __importDefault(require("expect"));
const bitcoin_1 = require("./families/bitcoin");
const evm_1 = require("./families/evm");
Object.defineProperty(exports, "approveToken", { enumerable: true, get: function () { return evm_1.approveToken; } });
Object.defineProperty(exports, "signTypedMessage", { enumerable: true, get: function () { return evm_1.signTypedMessage; } });
const polkadot_1 = require("./families/polkadot");
const algorand_1 = require("./families/algorand");
const tron_1 = require("./families/tron");
const stellar_1 = require("./families/stellar");
const cardano_1 = require("./families/cardano");
const xrp_1 = require("./families/xrp");
const aptos_1 = require("./families/aptos");
const hedera_1 = require("./families/hedera");
const near_1 = require("./families/near");
const cosmos_1 = require("./families/cosmos");
const kaspa_1 = require("./families/kaspa");
const solana_1 = require("./families/solana");
const tezos_1 = require("./families/tezos");
const celo_1 = require("./families/celo");
const multiversX_1 = require("./families/multiversX");
const osmosis_1 = require("./families/osmosis");
const AppInfos_1 = require("./enum/AppInfos");
const deviceLabelsData_1 = require("./data/deviceLabelsData");
const sui_1 = require("./families/sui");
const concordium_1 = require("./families/concordium");
const speculosAppVersion_1 = require("./speculosAppVersion");
const TouchDeviceSimulator_1 = require("./deviceInteraction/TouchDeviceSimulator");
const DeviceController_1 = require("./deviceInteraction/DeviceController");
const retryAxiosRequest_1 = require("./deviceInteraction/retryAxiosRequest");
const _1 = require(".");
const vechain_1 = require("./families/vechain");
const deviceCoordinates_1 = require("./deviceCoordinates");
const internet_computer_1 = require("./families/internet_computer");
const index_2 = require("./index");
const mina_1 = require("./families/mina");
const isSpeculosRemote = process.env.REMOTE_SPECULOS === "true";
const SCREEN_POLL_INTERVAL_MS = 500;
const SWAP_REVIEW_TRANSACTION_TIMEOUT_MS = 120_000;
// Derived from timeout + interval so the budget can't silently drift if either changes.
const SWAP_REVIEW_TRANSACTION_MAX_ATTEMPTS = Math.ceil(SWAP_REVIEW_TRANSACTION_TIMEOUT_MS / SCREEN_POLL_INTERVAL_MS);
function setExchangeDependencies(dependencies) {
    const map = new Map();
    for (const dep of dependencies) {
        if (!map.has(dep.name)) {
            map.set(dep.name, dep);
        }
    }
    exports.specs["Exchange"].dependencies = Array.from(map.values());
}
exports.specs = {
    Bitcoin: {
        currency: (0, index_1.getCryptoCurrencyById)("bitcoin"),
        appQuery: {
            model: (0, speculosAppVersion_1.getSpeculosModel)(),
            appName: "Bitcoin",
        },
        dependencies: [],
    },
    Aptos: {
        currency: (0, index_1.getCryptoCurrencyById)("aptos"),
        appQuery: {
            model: (0, speculosAppVersion_1.getSpeculosModel)(),
            appName: "Aptos",
        },
        dependencies: [],
    },
    Exchange: {
        appQuery: {
            model: (0, speculosAppVersion_1.getSpeculosModel)(),
            appName: "Exchange",
        },
        dependencies: [],
    },
    LedgerSync: {
        appQuery: {
            model: (0, speculosAppVersion_1.getSpeculosModel)(),
            appName: "Ledger Sync",
        },
        dependencies: [],
    },
    Dogecoin: {
        currency: (0, index_1.getCryptoCurrencyById)("dogecoin"),
        appQuery: {
            model: (0, speculosAppVersion_1.getSpeculosModel)(),
            appName: "Dogecoin",
        },
        dependencies: [],
    },
    Ethereum: {
        currency: (0, index_1.getCryptoCurrencyById)("ethereum"),
        appQuery: {
            model: (0, speculosAppVersion_1.getSpeculosModel)(),
            appName: "Ethereum",
        },
        dependencies: [],
    },
    Ethereum_Sepolia: {
        currency: (0, index_1.getCryptoCurrencyById)("ethereum_sepolia"),
        appQuery: {
            model: (0, speculosAppVersion_1.getSpeculosModel)(),
            appName: "Ethereum",
        },
        dependencies: [],
    },
    Ethereum_Classic: {
        currency: (0, index_1.getCryptoCurrencyById)("ethereum_classic"),
        appQuery: {
            model: (0, speculosAppVersion_1.getSpeculosModel)(),
            appName: "Ethereum Classic",
        },
        dependencies: [{ name: "Ethereum" }],
    },
    Bitcoin_Testnet: {
        currency: (0, index_1.getCryptoCurrencyById)("bitcoin_testnet"),
        appQuery: {
            model: (0, speculosAppVersion_1.getSpeculosModel)(),
            appName: "Bitcoin Test",
        },
        dependencies: [],
    },
    Solana: {
        currency: (0, index_1.getCryptoCurrencyById)("solana"),
        appQuery: {
            model: (0, speculosAppVersion_1.getSpeculosModel)(),
            appName: "Solana",
        },
        dependencies: [],
    },
    Cardano: {
        currency: (0, index_1.getCryptoCurrencyById)("cardano"),
        appQuery: {
            model: (0, speculosAppVersion_1.getSpeculosModel)(),
            appName: "CardanoADA",
        },
        dependencies: [],
    },
    Polkadot: {
        currency: (0, index_1.getCryptoCurrencyById)("polkadot"),
        appQuery: {
            model: (0, speculosAppVersion_1.getSpeculosModel)(),
            appName: "Polkadot",
        },
        dependencies: [],
    },
    Tron: {
        currency: (0, index_1.getCryptoCurrencyById)("tron"),
        appQuery: {
            model: (0, speculosAppVersion_1.getSpeculosModel)(),
            appName: "Tron",
        },
        dependencies: [],
    },
    XRP: {
        currency: (0, index_1.getCryptoCurrencyById)("ripple"),
        appQuery: {
            model: (0, speculosAppVersion_1.getSpeculosModel)(),
            appName: "XRP",
        },
        dependencies: [],
    },
    Stellar: {
        currency: (0, index_1.getCryptoCurrencyById)("stellar"),
        appQuery: {
            model: (0, speculosAppVersion_1.getSpeculosModel)(),
            appName: "Stellar",
        },
        dependencies: [],
    },
    Bitcoin_Cash: {
        currency: (0, index_1.getCryptoCurrencyById)("bitcoin_cash"),
        appQuery: {
            model: (0, speculosAppVersion_1.getSpeculosModel)(),
            appName: "Bitcoin Cash",
        },
        dependencies: [],
    },
    Algorand: {
        currency: (0, index_1.getCryptoCurrencyById)("algorand"),
        appQuery: {
            model: (0, speculosAppVersion_1.getSpeculosModel)(),
            appName: "Algorand",
        },
        dependencies: [],
    },
    Cosmos: {
        currency: (0, index_1.getCryptoCurrencyById)("cosmos"),
        appQuery: {
            model: (0, speculosAppVersion_1.getSpeculosModel)(),
            appName: "Cosmos",
        },
        dependencies: [],
    },
    Tezos: {
        currency: (0, index_1.getCryptoCurrencyById)("tezos"),
        appQuery: {
            model: (0, speculosAppVersion_1.getSpeculosModel)(),
            appName: "TezosWallet",
        },
        dependencies: [],
    },
    Polygon: {
        currency: (0, index_1.getCryptoCurrencyById)("polygon"),
        appQuery: {
            model: (0, speculosAppVersion_1.getSpeculosModel)(),
            appName: "Ethereum",
        },
        dependencies: [],
    },
    BNB_Chain: {
        currency: (0, index_1.getCryptoCurrencyById)("bsc"),
        appQuery: {
            model: (0, speculosAppVersion_1.getSpeculosModel)(),
            appName: "Ethereum",
        },
        dependencies: [],
    },
    Ton: {
        currency: (0, index_1.getCryptoCurrencyById)("ton"),
        appQuery: {
            model: (0, speculosAppVersion_1.getSpeculosModel)(),
            appName: "TON",
        },
        dependencies: [],
    },
    Near: {
        currency: (0, index_1.getCryptoCurrencyById)("near"),
        appQuery: {
            model: (0, speculosAppVersion_1.getSpeculosModel)(),
            appName: "NEAR",
        },
        dependencies: [],
    },
    Multivers_X: {
        currency: (0, index_1.getCryptoCurrencyById)("elrond"),
        appQuery: {
            model: (0, speculosAppVersion_1.getSpeculosModel)(),
            appName: "MultiversX",
        },
        dependencies: [],
    },
    Osmosis: {
        currency: (0, index_1.getCryptoCurrencyById)("osmo"),
        appQuery: {
            model: (0, speculosAppVersion_1.getSpeculosModel)(),
            appName: "Cosmos",
        },
        dependencies: [],
    },
    Injective: {
        currency: (0, index_1.getCryptoCurrencyById)("injective"),
        appQuery: {
            model: (0, speculosAppVersion_1.getSpeculosModel)(),
            appName: "Cosmos",
        },
        dependencies: [],
    },
    Celo: {
        currency: (0, index_1.getCryptoCurrencyById)("celo"),
        appQuery: {
            model: (0, speculosAppVersion_1.getSpeculosModel)(),
            appName: "Celo",
        },
        dependencies: [],
    },
    Sei: {
        currency: (0, index_1.getCryptoCurrencyById)("sei_evm"),
        appQuery: {
            model: (0, speculosAppVersion_1.getSpeculosModel)(),
            appName: "Sei",
        },
        dependencies: [AppInfos_1.AppInfos.ETHEREUM],
    },
    Litecoin: {
        currency: (0, index_1.getCryptoCurrencyById)("litecoin"),
        appQuery: {
            model: (0, speculosAppVersion_1.getSpeculosModel)(),
            appName: "Litecoin",
        },
        dependencies: [],
    },
    Kaspa: {
        currency: (0, index_1.getCryptoCurrencyById)("kaspa"),
        appQuery: {
            model: (0, speculosAppVersion_1.getSpeculosModel)(),
            appName: "Kaspa",
        },
        dependencies: [],
    },
    Hedera: {
        currency: (0, index_1.getCryptoCurrencyById)("hedera"),
        appQuery: {
            model: (0, speculosAppVersion_1.getSpeculosModel)(),
            appName: "Hedera",
        },
        dependencies: [],
    },
    Hedera_Testnet: {
        currency: (0, index_1.getCryptoCurrencyById)("hedera_testnet"),
        appQuery: {
            model: (0, speculosAppVersion_1.getSpeculosModel)(),
            appName: "Hedera",
        },
        dependencies: [],
    },
    Sui: {
        currency: (0, index_1.getCryptoCurrencyById)("sui"),
        appQuery: {
            model: (0, speculosAppVersion_1.getSpeculosModel)(),
            appName: "Sui",
        },
        dependencies: [],
    },
    Base: {
        currency: (0, index_1.getCryptoCurrencyById)("base"),
        appQuery: {
            model: (0, speculosAppVersion_1.getSpeculosModel)(),
            appName: "Ethereum",
        },
        dependencies: [],
    },
    Vechain: {
        currency: (0, index_1.getCryptoCurrencyById)("vechain"),
        appQuery: {
            model: (0, speculosAppVersion_1.getSpeculosModel)(),
            appName: "Vechain",
        },
        dependencies: [],
    },
    Zcash: {
        currency: (0, index_1.getCryptoCurrencyById)("zcash"),
        appQuery: {
            model: (0, speculosAppVersion_1.getSpeculosModel)(),
            appName: "Zcash",
        },
        dependencies: [],
    },
    Aleo: {
        currency: (0, index_1.getCryptoCurrencyById)("aleo"),
        appQuery: {
            model: (0, speculosAppVersion_1.getSpeculosModel)(),
            appName: "Aleo",
        },
        dependencies: [],
    },
    Internet_Computer: {
        currency: (0, index_1.getCryptoCurrencyById)("internet_computer"),
        appQuery: {
            model: (0, speculosAppVersion_1.getSpeculosModel)(),
            appName: "InternetComputer",
        },
        dependencies: [],
    },
    Velora: {
        appQuery: {
            model: (0, speculosAppVersion_1.getSpeculosModel)(),
            appName: "Velora",
        },
        dependencies: [AppInfos_1.AppInfos.ETHEREUM],
    },
    One_Inch: {
        appQuery: {
            model: (0, speculosAppVersion_1.getSpeculosModel)(),
            appName: "1inch",
        },
        dependencies: [AppInfos_1.AppInfos.ETHEREUM],
    },
    Mina: {
        currency: (0, index_1.getCryptoCurrencyById)("mina"),
        appQuery: {
            model: (0, speculosAppVersion_1.getSpeculosModel)(),
            appName: "Mina",
        },
        dependencies: [],
    },
    Concordium: {
        currency: (0, index_1.getCryptoCurrencyById)("concordium_testnet"),
        appQuery: {
            model: (0, speculosAppVersion_1.getSpeculosModel)(),
            appName: "Concordium",
        },
        dependencies: [],
    },
    "Concordium_(Testnet)": {
        currency: (0, index_1.getCryptoCurrencyById)("concordium_testnet"),
        appQuery: {
            model: (0, speculosAppVersion_1.getSpeculosModel)(),
            appName: "Concordium",
        },
        dependencies: [],
    },
};
// Resolves DeviceParams from the Provider 1 catalog (app version + firmware) and
// the spec's model. The app binary path is deterministic via conventionalAppSubpath,
// so we no longer scan COINAPPS — for local Docker we only verify the expected
// .elf is present on disk (COINAPPS is still mounted into the container).
async function startSpeculos(testName, spec, wantedApiPort) {
    (0, logs_1.log)("engine", `test ${testName}`);
    const { SEED, COINAPPS } = process.env;
    (0, invariant_1.default)(SEED, "SEED is not set");
    const { appQuery, onSpeculosDeviceCreated } = spec;
    const { model } = appQuery;
    const firmware = await (0, speculosAppVersion_1.getDeviceFirmwareVersion)(model);
    const catalogVersions = await (0, speculosAppVersion_1.getNanoAppCatalogVersionMap)((0, live_env_1.getEnv)("E2E_NANO_APP_VERSION_PATH"));
    const displayName = spec.currency?.managerAppName || appQuery.appName;
    const appVersion = appQuery.appVersion ?? catalogVersions.get(displayName);
    (0, invariant_1.default)(appVersion, "%s: no app version found in catalog for %s", testName, displayName);
    const appName = spec.currency ? spec.currency.managerAppName : appQuery.appName;
    const dependencies = spec.dependencies?.map(dep => {
        const appVersion = dep.appVersion ?? catalogVersions.get(dep.name);
        (0, invariant_1.default)(appVersion, "%s: no dependency version found in catalog for %s", testName, dep.name);
        return { name: dep.name, appVersion };
    });
    if (!isSpeculosRemote) {
        (0, invariant_1.default)(COINAPPS, "COINAPPS is not set");
        const assertElfExists = (n, v) => {
            const fullPath = path_1.default.join(COINAPPS, (0, speculos_1.conventionalAppSubpath)(model, firmware, n, v));
            (0, invariant_1.default)((0, fs_1.existsSync)(fullPath), "%s: app binary not found at %s", testName, fullPath);
        };
        assertElfExists(appName, appVersion);
        dependencies?.forEach(dep => {
            assertElfExists(dep.name, dep.appVersion);
        });
    }
    const deviceParams = {
        model,
        firmware,
        appName,
        appVersion: appVersion,
        seed: SEED,
        coinapps: COINAPPS ?? "",
        dependencies,
        onSpeculosDeviceCreated,
    };
    (0, logs_1.log)("engine", `test ${testName} will use ${appName} ${appVersion} on ${model} ${firmware}`);
    try {
        if (isSpeculosRemote)
            return await (0, speculosCI_1.createSpeculosDeviceCI)(deviceParams);
        const device = await (0, speculos_1.createSpeculosDevice)(deviceParams, 3, wantedApiPort);
        (0, invariant_1.default)(device.ports.apiPort, "[E2E] Speculos apiPort is not defined");
        return {
            id: device.id,
            port: device.ports.apiPort,
            appName,
            appVersion: appVersion,
            dependencies,
        };
    }
    catch (e) {
        console.error((0, _1.sanitizeError)(e));
        (0, logs_1.log)("engine", `test ${testName} failed with ${String(e)}`);
        throw (0, _1.sanitizeError)(e);
    }
}
async function stopSpeculos(deviceId) {
    if (deviceId) {
        (0, logs_1.log)("engine", `test ${deviceId} finished`);
        if (isSpeculosRemote) {
            await (0, speculosCI_1.releaseSpeculosDeviceCI)(deviceId);
        }
        else {
            await (0, speculos_1.releaseSpeculosDevice)(deviceId);
        }
    }
}
function getSpeculosAddress() {
    const speculosAddress = process.env.SPECULOS_ADDRESS;
    return speculosAddress || "http://127.0.0.1";
}
const _capturedSpeculosScreenshots = new Map();
function drainSpeculosScreenshots(port) {
    const screenshots = _capturedSpeculosScreenshots.get(port) ?? [];
    _capturedSpeculosScreenshots.delete(port);
    return screenshots;
}
async function waitFor(text, maxAttempts = 60) {
    const port = (0, live_env_1.getEnv)("SPECULOS_API_PORT");
    let texts = "";
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        texts = await fetchCurrentScreenTexts(port);
        if (texts.toLowerCase().includes(text.toLowerCase())) {
            return texts;
        }
        await (0, index_2.sleep)(SCREEN_POLL_INTERVAL_MS);
    }
    throw new Error(`Text "${text}" not found on device screen after ${maxAttempts} attempts. Last screen text: "${texts}"`);
}
async function waitForReviewTransaction(maxAttempts = 60) {
    if (!(0, speculosAppVersion_1.isTouchDevice)()) {
        await waitFor(DeviceLabels_1.DeviceLabels.REVIEW_TRANSACTION, maxAttempts);
        return;
    }
    const port = (0, live_env_1.getEnv)("SPECULOS_API_PORT");
    let texts = "";
    let enabled = false;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        texts = await fetchCurrentScreenTexts(port);
        if (texts.includes(DeviceLabels_1.DeviceLabels.REVIEW_TRANSACTION)) {
            return;
        }
        if (!enabled && texts.includes(DeviceLabels_1.DeviceLabels.YES_ENABLE)) {
            await (0, TouchDeviceSimulator_1.pressAndRelease)(DeviceLabels_1.DeviceLabels.YES_ENABLE);
            enabled = true; // press once, then keep polling for review within the same budget
        }
        await (0, index_2.sleep)(SCREEN_POLL_INTERVAL_MS);
    }
    throw new Error(`Text "${DeviceLabels_1.DeviceLabels.REVIEW_TRANSACTION}" not found on device screen after ${maxAttempts} attempts. Last screen text: "${texts}"`);
}
async function fetchCurrentScreenTexts(speculosApiPort) {
    const speculosAddress = getSpeculosAddress();
    const response = await (0, retryAxiosRequest_1.retryAxiosRequest)(() => axios_1.default.get(`${speculosAddress}:${speculosApiPort}/events?stream=false&currentscreenonly=true`));
    return response.data.events.map(event => event.text).join(" ");
}
async function getDeviceLabelCoordinates(label, speculosApiPort) {
    const speculosAddress = getSpeculosAddress();
    const response = await (0, retryAxiosRequest_1.retryAxiosRequest)(() => axios_1.default.get(`${speculosAddress}:${speculosApiPort}/events?stream=false&currentscreenonly=true`));
    const event = response.data.events.find(e => e.text === label);
    if (!event) {
        throw new Error(`Label "${label}" not found in screen events`);
    }
    return { x: event.x, y: event.y };
}
async function fetchAllEvents(speculosApiPort) {
    const speculosAddress = getSpeculosAddress();
    const response = await (0, retryAxiosRequest_1.retryAxiosRequest)(() => axios_1.default.get(`${speculosAddress}:${speculosApiPort}/events?stream=false&currentscreenonly=false`));
    return response.data.events.map(event => event.text);
}
exports.pressUntilTextFound = (0, DeviceController_1.withDeviceController)(({ getButtonsController }) => async (targetText, strictMatch = false) => {
    const maxAttempts = 18;
    const speculosApiPort = (0, live_env_1.getEnv)("SPECULOS_API_PORT");
    const buttons = getButtonsController();
    const seenScreens = new Set();
    const portScreenshots = _capturedSpeculosScreenshots.get(speculosApiPort) ?? [];
    _capturedSpeculosScreenshots.set(speculosApiPort, portScreenshots);
    for (let attempts = 0; attempts < maxAttempts; attempts++) {
        const texts = await fetchCurrentScreenTexts(speculosApiPort);
        const isMatch = strictMatch
            ? texts === targetText
            : texts.toLowerCase().includes(targetText.toLowerCase());
        if (!seenScreens.has(texts)) {
            seenScreens.add(texts);
            const screenshot = await takeScreenshot(speculosApiPort);
            if (screenshot)
                portScreenshots.push(screenshot);
        }
        if (isMatch) {
            return await fetchAllEvents(speculosApiPort);
        }
        if ((0, speculosAppVersion_1.isTouchDevice)()) {
            await (0, TouchDeviceSimulator_1.swipeRight)();
        }
        else {
            await buttons.right();
        }
        await (0, index_2.sleep)(200);
    }
    const screensLog = [...seenScreens].map((s, i) => `[${i + 1}] "${s}"`).join(" → ");
    throw new Error(`ElementNotFoundException: Element with text "${targetText}" not found on speculos screen. Screens observed during navigation (${seenScreens.size} unique): ${screensLog}`);
});
function containsSubstringInEvent(targetString, events) {
    const concatenatedEvents = events.join("");
    let result = concatenatedEvents.includes(targetString);
    if (!result) {
        const regexPattern = targetString.split("").join(".*?");
        const regex = new RegExp(regexPattern, "s");
        result = regex.test(concatenatedEvents);
    }
    return result;
}
async function takeScreenshot(port) {
    const speculosAddress = getSpeculosAddress();
    const speculosApiPort = port ?? (0, live_env_1.getEnv)("SPECULOS_API_PORT");
    try {
        const response = await (0, retryAxiosRequest_1.retryAxiosRequest)(() => axios_1.default.get(`${speculosAddress}:${speculosApiPort}/screenshot`, {
            responseType: "arraybuffer",
        }));
        return response.data;
    }
    catch (error) {
        console.error("Error downloading speculos screenshot:", (0, _1.sanitizeError)(error));
    }
}
exports.removeMemberLedgerSync = (0, DeviceController_1.withDeviceController)(({ getButtonsController }) => async () => {
    const buttons = getButtonsController();
    await waitFor(DeviceLabels_1.DeviceLabels.CONNECT_TO);
    if ((0, speculosAppVersion_1.isTouchDevice)()) {
        await (0, TouchDeviceSimulator_1.pressAndRelease)(DeviceLabels_1.DeviceLabels.CONNECT);
        await waitFor(DeviceLabels_1.DeviceLabels.REMOVE_FROM_LEDGER_SYNC);
        await (0, TouchDeviceSimulator_1.pressAndRelease)(DeviceLabels_1.DeviceLabels.REMOVE);
        await waitFor(DeviceLabels_1.DeviceLabels.CONFIRM_CHANGE);
        await (0, TouchDeviceSimulator_1.pressAndRelease)(DeviceLabels_1.DeviceLabels.TAP_TO_CONTINUE);
        await waitFor(DeviceLabels_1.DeviceLabels.TURN_ON_SYNC);
        await (0, exports.pressUntilTextFound)(DeviceLabels_1.DeviceLabels.LEDGER_WALLET_WILL_BE);
        await (0, exports.pressUntilTextFound)(DeviceLabels_1.DeviceLabels.TURN_ON_SYNC);
        const turnOnSyncCoordinates = (0, deviceCoordinates_1.getDeviceCoordinates)("turnOnSync");
        await (0, TouchDeviceSimulator_1.pressAndRelease)(DeviceLabels_1.DeviceLabels.TURN_ON_SYNC, turnOnSyncCoordinates.x, turnOnSyncCoordinates.y);
    }
    else {
        await (0, exports.pressUntilTextFound)(DeviceLabels_1.DeviceLabels.CONNECT, true);
        await buttons.both();
        await waitFor(DeviceLabels_1.DeviceLabels.REMOVE_FROM_LEDGER_SYNC);
        await (0, exports.pressUntilTextFound)(DeviceLabels_1.DeviceLabels.REMOVE, true);
        await buttons.both();
        await waitFor(DeviceLabels_1.DeviceLabels.TURN_ON_SYNC);
        await (0, exports.pressUntilTextFound)(DeviceLabels_1.DeviceLabels.LEDGER_WALLET_WILL_BE);
        await (0, exports.pressUntilTextFound)(DeviceLabels_1.DeviceLabels.TURN_ON_SYNC);
        await buttons.both();
    }
});
exports.activateLedgerSync = (0, DeviceController_1.withDeviceController)(({ getButtonsController }) => async () => {
    const buttons = getButtonsController();
    await waitFor(DeviceLabels_1.DeviceLabels.CONNECT_TO);
    if ((0, speculosAppVersion_1.isTouchDevice)()) {
        await (0, TouchDeviceSimulator_1.pressAndRelease)(DeviceLabels_1.DeviceLabels.CONNECT);
    }
    else {
        await (0, exports.pressUntilTextFound)(DeviceLabels_1.DeviceLabels.CONNECT_TO_LEDGER_SYNC);
        await buttons.right();
        await buttons.both();
    }
    await waitFor(DeviceLabels_1.DeviceLabels.TURN_ON_SYNC);
    if ((0, speculosAppVersion_1.isTouchDevice)()) {
        const turnOnSyncCoordinates = (0, deviceCoordinates_1.getDeviceCoordinates)("turnOnSync");
        await (0, TouchDeviceSimulator_1.pressAndRelease)(DeviceLabels_1.DeviceLabels.TURN_ON_SYNC, turnOnSyncCoordinates.x, turnOnSyncCoordinates.y);
    }
    else {
        await (0, exports.pressUntilTextFound)(DeviceLabels_1.DeviceLabels.LEDGER_WALLET_WILL_BE);
        await (0, exports.pressUntilTextFound)(DeviceLabels_1.DeviceLabels.TURN_ON_SYNC);
        await buttons.both();
    }
});
exports.activateExpertMode = (0, DeviceController_1.withDeviceController)(({ getButtonsController }) => async () => {
    const buttons = getButtonsController();
    if ((0, speculosAppVersion_1.isTouchDevice)()) {
        await (0, exports.goToSettings)();
        const settingsToggle1Coords = (0, deviceCoordinates_1.getDeviceCoordinates)("settingsToggle1");
        await (0, TouchDeviceSimulator_1.pressAndRelease)(DeviceLabels_1.DeviceLabels.SETTINGS_TOGGLE_1, settingsToggle1Coords.x, settingsToggle1Coords.y);
    }
    else {
        await (0, exports.pressUntilTextFound)(DeviceLabels_1.DeviceLabels.EXPERT_MODE);
        await buttons.both();
    }
});
exports.activateContractData = (0, DeviceController_1.withDeviceController)(({ getButtonsController }) => async () => {
    const buttons = getButtonsController();
    await (0, exports.pressUntilTextFound)(DeviceLabels_1.DeviceLabels.SETTINGS);
    await buttons.both();
    await waitFor(DeviceLabels_1.DeviceLabels.CONTRACT_DATA);
    await buttons.both();
});
exports.goToSettings = (0, DeviceController_1.withDeviceController)(({ getButtonsController }) => async () => {
    const buttons = getButtonsController();
    if ((0, speculosAppVersion_1.isTouchDevice)()) {
        const settingsCogwheelCoords = (0, deviceCoordinates_1.getDeviceCoordinates)("settingsCogwheel");
        await (0, TouchDeviceSimulator_1.pressAndRelease)(DeviceLabels_1.DeviceLabels.SETTINGS, settingsCogwheelCoords.x, settingsCogwheelCoords.y);
    }
    else {
        await (0, exports.pressUntilTextFound)(DeviceLabels_1.DeviceLabels.SETTINGS);
        await buttons.both();
    }
});
exports.providePublicKey = (0, DeviceController_1.withDeviceController)(({ getButtonsController }) => async () => {
    const buttons = getButtonsController();
    await buttons.right();
});
function getDeviceLabels(appInfo) {
    const deviceModel = (0, speculosAppVersion_1.getSpeculosModel)();
    const deviceConfig = deviceLabelsData_1.DEVICE_LABELS_CONFIG[deviceModel] ?? deviceLabelsData_1.DEVICE_LABELS_CONFIG.default;
    if (!deviceConfig) {
        throw new Error(`No device configuration found for ${deviceModel}`);
    }
    const receiveVerifyLabel = deviceConfig.receiveVerify[appInfo.name] ?? deviceConfig.receiveVerify.default;
    const receiveConfirmLabel = deviceConfig.receiveConfirm[appInfo.name] ?? deviceConfig.receiveConfirm.default;
    const delegateVerifyLabel = deviceConfig.delegateVerify[appInfo.name] ?? deviceConfig.delegateVerify.default;
    const delegateConfirmLabel = deviceConfig.delegateConfirm[appInfo.name] ?? deviceConfig.delegateConfirm.default;
    const sendVerifyLabel = deviceConfig.sendVerify[appInfo.name] ?? deviceConfig.sendVerify.default;
    const sendConfirmLabel = deviceConfig.sendConfirm[appInfo.name] ?? deviceConfig.sendConfirm.default;
    return {
        receiveVerifyLabel,
        receiveConfirmLabel,
        delegateVerifyLabel,
        delegateConfirmLabel,
        sendVerifyLabel,
        sendConfirmLabel,
    };
}
exports.expectValidAddressDevice = (0, DeviceController_1.withDeviceController)(({ getButtonsController }) => async (account, addressDisplayed) => {
    const buttons = getButtonsController();
    if (account.currency === Currency_1.Currency.SUI_USDC) {
        await (0, exports.providePublicKey)();
    }
    const { receiveVerifyLabel, receiveConfirmLabel } = getDeviceLabels(account.currency.speculosApp);
    await waitFor(receiveVerifyLabel);
    if ((0, speculosAppVersion_1.isTouchDevice)()) {
        const events = await (0, exports.pressUntilTextFound)(receiveConfirmLabel);
        const isAddressCorrect = containsSubstringInEvent(addressDisplayed, events);
        (0, expect_1.default)(isAddressCorrect).toBeTruthy();
        await (0, TouchDeviceSimulator_1.pressAndRelease)(DeviceLabels_1.DeviceLabels.CONFIRM);
    }
    else {
        const events = await (0, exports.pressUntilTextFound)(receiveConfirmLabel);
        const isAddressCorrect = containsSubstringInEvent(addressDisplayed, events);
        (0, expect_1.default)(isAddressCorrect).toBeTruthy();
        await buttons.both();
    }
});
async function signSendTransaction(tx) {
    const currencyId = tx.accountToDebit.currency.id;
    switch (currencyId) {
        case Currency_1.Currency.sepETH.id:
        case Currency_1.Currency.BASE.id:
        case Currency_1.Currency.POL.id:
        case Currency_1.Currency.ETH.id:
        case Currency_1.Currency.ETH_USDT.id:
        case Currency_1.Currency.SEI_EVM.id:
            await (0, evm_1.sendEVM)(tx);
            break;
        case Currency_1.Currency.BTC.id:
            await (0, bitcoin_1.sendBTC)(tx);
            break;
        case Currency_1.Currency.DOGE.id:
        case Currency_1.Currency.BCH.id:
        case Currency_1.Currency.ZEC.id:
            await (0, bitcoin_1.sendBTCBasedCoin)(tx, currencyId);
            break;
        case Currency_1.Currency.DOT.id:
            await (0, polkadot_1.sendPolkadot)(tx);
            break;
        case Currency_1.Currency.ALGO.id:
            await (0, algorand_1.sendAlgorand)(tx);
            break;
        case Currency_1.Currency.SOL.id:
        case Currency_1.Currency.SOL_GIGA.id:
            await (0, solana_1.sendSolana)(tx);
            break;
        case Currency_1.Currency.TRX.id:
            await (0, tron_1.sendTron)(tx);
            break;
        case Currency_1.Currency.XLM.id:
            await (0, stellar_1.sendStellar)(tx);
            break;
        case Currency_1.Currency.ATOM.id:
            await (0, cosmos_1.sendCosmos)(tx);
            break;
        case Currency_1.Currency.ADA.id:
            await (0, cardano_1.sendCardano)(tx);
            break;
        case Currency_1.Currency.XRP.id:
            await (0, xrp_1.sendXRP)(tx);
            break;
        case Currency_1.Currency.APT.id:
            await (0, aptos_1.sendAptos)(tx);
            break;
        case Currency_1.Currency.KAS.id:
            await (0, kaspa_1.sendKaspa)(tx);
            break;
        case Currency_1.Currency.HBAR.id:
            await (0, hedera_1.sendHedera)();
            break;
        case Currency_1.Currency.SUI.id:
        case Currency_1.Currency.SUI_USDC.id:
            await (0, sui_1.sendSui)(tx);
            break;
        case Currency_1.Currency.VET.id:
            await (0, vechain_1.sendVechain)(tx);
            break;
        case Currency_1.Currency.ICP.id:
            await (0, internet_computer_1.sendInternetComputer)(tx);
            break;
        case Currency_1.Currency.CCD_TESTNET.id:
            await (0, concordium_1.sendConcordium)(tx);
            break;
        default:
            throw new Error(`Unsupported currency: ${tx.accountToDebit.currency.ticker}`);
    }
}
async function getSendEvents(tx) {
    const { sendVerifyLabel, sendConfirmLabel } = getDeviceLabels(tx.accountToDebit.currency.speculosApp);
    await waitFor(sendVerifyLabel);
    return await (0, exports.pressUntilTextFound)(sendConfirmLabel);
}
async function signDelegationTransaction(delegatingAccount) {
    const currencyName = delegatingAccount.account.currency.name;
    switch (currencyName) {
        case Account_1.Account.SOL_1.currency.name:
            await (0, solana_1.delegateSolana)(delegatingAccount);
            break;
        case Account_1.Account.NEAR_1.currency.name:
            await (0, near_1.delegateNear)(delegatingAccount);
            break;
        case Account_1.Account.ATOM_1.currency.name:
        case Account_1.Account.INJ_1.currency.name:
            await (0, cosmos_1.delegateCosmos)(delegatingAccount);
            break;
        case Account_1.Account.OSMO_1.currency.name:
            await (0, osmosis_1.delegateOsmosis)(delegatingAccount);
            break;
        case Account_1.Account.MULTIVERS_X_1.currency.name:
            await (0, multiversX_1.delegateMultiversX)(delegatingAccount);
            break;
        case Account_1.Account.ADA_1.currency.name:
            await (0, cardano_1.delegateCardano)();
            break;
        case Account_1.Account.XTZ_1.currency.name:
            await (0, tezos_1.delegateTezos)(delegatingAccount);
            break;
        case Account_1.Account.CELO_1.currency.name:
            await (0, celo_1.delegateCelo)(delegatingAccount);
            break;
        case Account_1.Account.APTOS_1.currency.name:
            await (0, aptos_1.delegateAptos)(delegatingAccount);
            break;
        case Account_1.Account.MINA_1.currency.name:
            await (0, mina_1.delegateMina)(delegatingAccount);
            break;
        default:
            throw new Error(`Unsupported currency: ${currencyName}`);
    }
}
async function getDelegateEvents(delegatingAccount) {
    const { delegateVerifyLabel, delegateConfirmLabel } = getDeviceLabels(delegatingAccount.account.currency.speculosApp);
    await waitFor(delegateVerifyLabel);
    return await (0, exports.pressUntilTextFound)(delegateConfirmLabel);
}
exports.verifyAmountsAndAcceptSwap = (0, DeviceController_1.withDeviceController)(({ getButtonsController }) => async (swap, amount) => {
    const buttons = getButtonsController();
    await waitForReviewTransaction(SWAP_REVIEW_TRANSACTION_MAX_ATTEMPTS);
    const events = (0, speculosAppVersion_1.getSpeculosModel)() === devices_1.DeviceModelId.nanoS
        ? await (0, exports.pressUntilTextFound)(DeviceLabels_1.DeviceLabels.ACCEPT_AND_SEND)
        : await (0, exports.pressUntilTextFound)(DeviceLabels_1.DeviceLabels.SIGN_TRANSACTION);
    verifySwapData(swap, events, amount);
    if ((0, speculosAppVersion_1.isTouchDevice)()) {
        await (0, TouchDeviceSimulator_1.longPressAndRelease)(DeviceLabels_1.DeviceLabels.HOLD_TO_SIGN, 3);
    }
    else {
        await buttons.both();
    }
});
exports.verifyAmountsAndAcceptSwapForDifferentSeed = (0, DeviceController_1.withDeviceController)(({ getButtonsController }) => async (swap, amount, errorMessage) => {
    const buttons = getButtonsController();
    if (errorMessage === null) {
        if ((0, speculosAppVersion_1.isTouchDevice)()) {
            await waitFor(DeviceLabels_1.DeviceLabels.RECEIVE_ADDRESS_DOES_NOT_BELONG);
            await (0, TouchDeviceSimulator_1.pressAndRelease)(DeviceLabels_1.DeviceLabels.CONTINUE_ANYWAY);
        }
        else {
            await waitFor(DeviceLabels_1.DeviceLabels.REVIEW_TRANSACTION, SWAP_REVIEW_TRANSACTION_MAX_ATTEMPTS);
            await (0, exports.pressUntilTextFound)(DeviceLabels_1.DeviceLabels.RECEIVE_ADDRESS_DOES_NOT_BELONG);
            await buttons.both();
        }
    }
    else {
        await waitForReviewTransaction(SWAP_REVIEW_TRANSACTION_MAX_ATTEMPTS);
    }
    const events = await (0, exports.pressUntilTextFound)(DeviceLabels_1.DeviceLabels.SIGN_TRANSACTION);
    verifySwapData(swap, events, amount);
    if ((0, speculosAppVersion_1.isTouchDevice)()) {
        await (0, TouchDeviceSimulator_1.longPressAndRelease)(DeviceLabels_1.DeviceLabels.HOLD_TO_SIGN, 3);
    }
    else {
        await buttons.both();
    }
});
exports.verifyAmountsAndRejectSwap = (0, DeviceController_1.withDeviceController)(({ getButtonsController }) => async (swap, amount) => {
    const buttons = getButtonsController();
    await waitForReviewTransaction(SWAP_REVIEW_TRANSACTION_MAX_ATTEMPTS);
    let events = [];
    if ((0, speculosAppVersion_1.isTouchDevice)()) {
        events = await (0, exports.pressUntilTextFound)(DeviceLabels_1.DeviceLabels.HOLD_TO_SIGN);
    }
    else {
        events = await (0, exports.pressUntilTextFound)(DeviceLabels_1.DeviceLabels.REJECT);
    }
    verifySwapData(swap, events, amount);
    if ((0, speculosAppVersion_1.isTouchDevice)()) {
        await (0, TouchDeviceSimulator_1.pressAndRelease)(DeviceLabels_1.DeviceLabels.REJECT);
        await waitFor(DeviceLabels_1.DeviceLabels.YES_REJECT);
        await (0, TouchDeviceSimulator_1.pressAndRelease)(DeviceLabels_1.DeviceLabels.YES_REJECT);
    }
    else {
        await buttons.both();
    }
});
function verifySwapData(swap, events, amount) {
    const swapPair = `swap ${swap.getAccountToDebit.currency.ticker} to ${swap.getAccountToCredit.currency.ticker}`;
    if ((0, speculosAppVersion_1.getSpeculosModel)() !== devices_1.DeviceModelId.nanoS) {
        if (swap.provider && swap.provider.app && swap.provider.app !== AppInfos_1.AppInfos.EXCHANGE) {
            expectDeviceScreenContains(swap.provider.uiName, events, "Provider not found on the device screen");
        }
        else {
            expectDeviceScreenContains(swapPair, events, "Swap pair not found on the device screen");
        }
    }
    expectDeviceScreenContains(amount, events, `Amount ${amount} not found on the device screen`);
}
function expectDeviceScreenContains(substring, events, message) {
    const found = containsSubstringInEvent(substring, events);
    if (!found) {
        throw new Error(`${message}. Expected events to contain "${substring}". Got: ${JSON.stringify(events)}`);
    }
}
exports.exportUfvk = (0, DeviceController_1.withDeviceController)(({ getButtonsController }) => async (account) => {
    const buttons = getButtonsController();
    if ((0, speculosAppVersion_1.isTouchDevice)()) {
        await (0, exports.pressUntilTextFound)(DeviceLabels_1.DeviceLabels.CONFIRM);
        await (0, TouchDeviceSimulator_1.pressAndRelease)(DeviceLabels_1.DeviceLabels.CONFIRM);
    }
    else {
        await (0, exports.pressUntilTextFound)(DeviceLabels_1.DeviceLabels.CONFIRM);
        await buttons.both();
    }
});
exports.shareViewKey = (0, DeviceController_1.withDeviceController)(({ getButtonsController }) => async () => {
    const buttons = getButtonsController();
    await (0, exports.pressUntilTextFound)(DeviceLabels_1.DeviceLabels.CONFIRM);
    if ((0, speculosAppVersion_1.isTouchDevice)()) {
        await (0, TouchDeviceSimulator_1.pressAndRelease)(DeviceLabels_1.DeviceLabels.CONFIRM);
    }
    else {
        await buttons.both();
    }
});
exports.acceptEnableTransactionCheck = (0, DeviceController_1.withDeviceController)(({ getButtonsController }) => async () => {
    const buttons = getButtonsController();
    // Wait for loading to finish: poll until either the Transaction Check prompt
    // or the next (review transaction) screen is displayed. If the prompt never
    // shows up, skip this step instead of waiting for it to appear.
    const port = (0, live_env_1.getEnv)("SPECULOS_API_PORT");
    const enableLabel = DeviceLabels_1.DeviceLabels.ENABLE_TRANSACTION_CHECK.toLowerCase();
    const reviewLabel = DeviceLabels_1.DeviceLabels.REVIEW_TRANSACTION.toLowerCase();
    let isTransactionCheckDisplayed = false;
    for (let attempt = 0; attempt < 60; attempt++) {
        const texts = (await fetchCurrentScreenTexts(port)).toLowerCase();
        if (texts.includes(enableLabel)) {
            isTransactionCheckDisplayed = true;
            break;
        }
        if (texts.includes(reviewLabel)) {
            break;
        }
        await (0, index_2.sleep)(500);
    }
    if (!isTransactionCheckDisplayed) {
        return;
    }
    if ((0, speculosAppVersion_1.isTouchDevice)()) {
        await (0, TouchDeviceSimulator_1.pressAndRelease)(DeviceLabels_1.DeviceLabels.YES_ENABLE);
    }
    else {
        await (0, exports.pressUntilTextFound)(DeviceLabels_1.DeviceLabels.CONFIRM);
        await buttons.both();
    }
});
//# sourceMappingURL=speculos.js.map