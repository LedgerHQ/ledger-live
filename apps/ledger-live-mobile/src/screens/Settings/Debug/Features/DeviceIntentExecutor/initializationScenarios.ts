import { DeviceModelId } from "@ledgerhq/device-management-kit";
import { FlowName } from "@ledgerhq/live-common/device-action/utils";
import type { InitializerConfig } from "LLM/components/DeviceIntentExecutor/DeviceContextInitializerComponentLWM";
import type { InitializationInput } from "LLM/components/DeviceIntentExecutor/types";

export type InitializationScenario = {
  id: string;
  title: string;
  description: string;
  input: InitializationInput;
  inputSummary: string;
  initializerConfig?: InitializerConfig;
  initializerConfigSummary: string;
};

const ETHEREUM_INPUT_SUMMARY = "Opens Ethereum, derives 44'/60'/0'/0/0.";
const ETHEREUM_DEPRECATION_INPUT_SUMMARY =
  "Opens Ethereum, derives 44'/60'/0'/0/0, signals deprecation flow=send / currency=Ethereum.";
const BITCOIN_INPUT_SUMMARY = "Opens Bitcoin, derives native segwit 84'/0'/0'/0/0.";
const NO_INITIALIZER_OVERRIDES_SUMMARY =
  "No overrides — uses real production dependencies (remote config etc. not overridden).";

const BOLOS_INPUT: InitializationInput = {
  appName: "BOLOS",
  dependencies: [],
  requireLatestFirmware: false,
  allowPartialDependencies: false,
};

const ETHEREUM_INPUT: InitializationInput = {
  appName: "Ethereum",
  dependencies: [],
  requireLatestFirmware: false,
  allowPartialDependencies: false,
  requiresDerivation: {
    currencyId: "ethereum",
    path: "44'/60'/0'/0/0",
    derivationMode: "ethM",
    forceFormat: "eip55",
  },
};

const BITCOIN_INPUT: InitializationInput = {
  appName: "Bitcoin",
  dependencies: [],
  requireLatestFirmware: false,
  allowPartialDependencies: false,
  requiresDerivation: {
    currencyId: "bitcoin",
    path: "84'/0'/0'/0/0",
    derivationMode: "native_segwit",
  },
};

const PAST_DATE = "2000-01-01T00:00:00.000Z";
const FUTURE_DATE = "2999-01-01T00:00:00.000Z";

const deprecatedDeviceModels = [
  DeviceModelId.NANO_S,
  DeviceModelId.NANO_SP,
  DeviceModelId.NANO_X,
  DeviceModelId.STAX,
  DeviceModelId.FLEX,
  DeviceModelId.APEX,
];

type ScreenTrigger = {
  date: typeof PAST_DATE | typeof FUTURE_DATE;
  deprecatedFlow: FlowName[];
};

function buildEthereumSendDeprecationConfig(params: {
  warningScreen: ScreenTrigger;
  warningClearSigningScreen: ScreenTrigger;
  errorScreen: ScreenTrigger;
}) {
  return () =>
    deprecatedDeviceModels.map(deviceModelId => ({
      deviceModelId,
      warningScreen: { ...params.warningScreen, exception: [] },
      warningClearSigningScreen: { ...params.warningClearSigningScreen, exception: [] },
      errorScreen: { ...params.errorScreen, exception: [] },
    }));
}

const ETHEREUM_SEND_DEPRECATION: NonNullable<InitializationInput["deprecation"]> = {
  flow: FlowName.send,
  currencyName: "Ethereum",
};

export const INITIALIZATION_SCENARIOS: InitializationScenario[] = [
  {
    id: "bolos-dashboard",
    title: "BOLOS dashboard",
    description:
      "Opens the dashboard without derivation.\nExpect a successful context with no derivedAddress.",
    input: BOLOS_INPUT,
    inputSummary: "Opens the BOLOS dashboard, no derivation.",
    initializerConfigSummary: NO_INITIALIZER_OVERRIDES_SUMMARY,
  },
  {
    id: "ethereum-derivation",
    title: "Ethereum derivation",
    description:
      "Opens Ethereum and derives 44'/60'/0'/0/0.\nExpect derivedAddress to be populated.",
    input: ETHEREUM_INPUT,
    inputSummary: ETHEREUM_INPUT_SUMMARY,
    initializerConfigSummary: NO_INITIALIZER_OVERRIDES_SUMMARY,
  },
  {
    id: "bitcoin-derivation",
    title: "Bitcoin derivation",
    description:
      "Opens Bitcoin and derives native segwit 84'/0'/0'/0/0.\nExpect derivedAddress to be populated.",
    input: BITCOIN_INPUT,
    inputSummary: BITCOIN_INPUT_SUMMARY,
    initializerConfigSummary: NO_INITIALIZER_OVERRIDES_SUMMARY,
  },
  {
    id: "bitcoin-should-upgrade",
    title: "Bitcoin forced should-upgrade",
    description:
      "Injects shouldUpgrade() returning true for Bitcoin to exercise the app upgrade flow.\nIn production, shouldUpgrade only returns true for Bitcoin-family apps (the Bitcoin app itself, or apps depending on Bitcoin that use legacy segwit) with a version below 1.4.0 — see LSB-010 (trusted input requirement for segwit).",
    input: BITCOIN_INPUT,
    inputSummary: BITCOIN_INPUT_SUMMARY,
    initializerConfig: {
      dependencies: {
        shouldUpgrade: () => true,
      },
    },
    initializerConfigSummary:
      "shouldUpgrade() returns true — in prod this only triggers for Bitcoin-family apps below 1.4.0 (LSB-010).",
  },
  {
    id: "ethereum-forced-min-app",
    title: "Ethereum forced min app",
    description:
      "Injects a high Ethereum min version to exercise app version handling and install/update states.",
    input: ETHEREUM_INPUT,
    inputSummary: ETHEREUM_INPUT_SUMMARY,
    initializerConfig: {
      dependencies: {
        getMinVersion: () => "99.99.99",
      },
    },
    initializerConfigSummary: "getMinVersion() returns 99.99.99 (forces install/update).",
  },
  {
    id: "ethereum-deprecation-warning",
    title: "Ethereum deprecation warning",
    description:
      "Injects a past warning deprecation config for Ethereum send.\nExpect a deprecation warning UI before the echo intent runs.",
    input: {
      ...ETHEREUM_INPUT,
      deprecation: ETHEREUM_SEND_DEPRECATION,
    },
    inputSummary: ETHEREUM_DEPRECATION_INPUT_SUMMARY,
    initializerConfig: {
      dependencies: {
        getDeprecationConfig: buildEthereumSendDeprecationConfig({
          warningScreen: { date: PAST_DATE, deprecatedFlow: [FlowName.send] },
          warningClearSigningScreen: { date: FUTURE_DATE, deprecatedFlow: [] },
          errorScreen: { date: FUTURE_DATE, deprecatedFlow: [] },
        }),
      },
    },
    initializerConfigSummary:
      "getDeprecationConfig returns a past warning screen for Ethereum send on all supported models.",
  },
  {
    id: "ethereum-deprecation-clear-signing",
    title: "Ethereum deprecation clear-signing warning",
    description:
      "Injects a past clear-signing deprecation config for Ethereum send.\nExpect a clear-signing warning UI before the echo intent runs.",
    input: {
      ...ETHEREUM_INPUT,
      deprecation: ETHEREUM_SEND_DEPRECATION,
    },
    inputSummary: ETHEREUM_DEPRECATION_INPUT_SUMMARY,
    initializerConfig: {
      dependencies: {
        getDeprecationConfig: buildEthereumSendDeprecationConfig({
          warningScreen: { date: FUTURE_DATE, deprecatedFlow: [] },
          warningClearSigningScreen: { date: PAST_DATE, deprecatedFlow: [FlowName.send] },
          errorScreen: { date: FUTURE_DATE, deprecatedFlow: [] },
        }),
      },
    },
    initializerConfigSummary:
      "getDeprecationConfig returns a past clear-signing screen for Ethereum send on all supported models.",
  },
  {
    id: "ethereum-deprecation-warning-and-clear-signing",
    title: "Ethereum deprecation warning + clear-signing",
    description:
      "Injects past warning and clear-signing deprecation configs for Ethereum send.\nExpect the warning UI followed by the clear-signing UI before the echo intent runs.",
    input: {
      ...ETHEREUM_INPUT,
      deprecation: ETHEREUM_SEND_DEPRECATION,
    },
    inputSummary: ETHEREUM_DEPRECATION_INPUT_SUMMARY,
    initializerConfig: {
      dependencies: {
        getDeprecationConfig: buildEthereumSendDeprecationConfig({
          warningScreen: { date: PAST_DATE, deprecatedFlow: [FlowName.send] },
          warningClearSigningScreen: { date: PAST_DATE, deprecatedFlow: [FlowName.send] },
          errorScreen: { date: FUTURE_DATE, deprecatedFlow: [] },
        }),
      },
    },
    initializerConfigSummary:
      "getDeprecationConfig returns past warning and clear-signing screens for Ethereum send on all supported models.",
  },
  {
    id: "ethereum-deprecation-blocking",
    title: "Ethereum deprecation blocking",
    description:
      "Injects a past blocking deprecation config for Ethereum send.\nExpect the device deprecation error screen and no echo intent.",
    input: {
      ...ETHEREUM_INPUT,
      deprecation: ETHEREUM_SEND_DEPRECATION,
    },
    inputSummary: ETHEREUM_DEPRECATION_INPUT_SUMMARY,
    initializerConfig: {
      dependencies: {
        getDeprecationConfig: buildEthereumSendDeprecationConfig({
          warningScreen: { date: FUTURE_DATE, deprecatedFlow: [] },
          warningClearSigningScreen: { date: FUTURE_DATE, deprecatedFlow: [] },
          errorScreen: { date: PAST_DATE, deprecatedFlow: [FlowName.send] },
        }),
      },
    },
    initializerConfigSummary:
      "getDeprecationConfig returns a past blocking error screen for Ethereum send on all supported models.",
  },
  {
    id: "ethereum-wrong-account",
    title: "Ethereum wrong account",
    description:
      "Requests an Ethereum derivation but expects an impossible address. This address is impossible so it cannot match the derived address.\nExpect a wrong-device / wrong-account mismatch.",
    input: {
      ...ETHEREUM_INPUT,
      expectedAccount: {
        accountName: "Impossible Ethereum Account",
        acceptableDerivedAddresses: ["0ximpossibleaddress"],
      },
    },
    inputSummary:
      "Opens Ethereum, derives 44'/60'/0'/0/0, expects account \"Impossible Ethereum Account\" with acceptable address 0ximpossibleaddress.",
    initializerConfigSummary: NO_INITIALIZER_OVERRIDES_SUMMARY,
  },
];
