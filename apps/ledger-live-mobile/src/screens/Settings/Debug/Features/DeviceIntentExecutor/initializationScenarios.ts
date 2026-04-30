import { DeviceModelId } from "@ledgerhq/device-management-kit";
import { FlowName } from "@ledgerhq/live-common/device-action/utils";
import type { InitializerConfig } from "LLM/components/DeviceIntentExecutor/DeviceContextInitializerComponentLWM";
import type { InitializationInput } from "LLM/components/DeviceIntentExecutor/types";

export type InitializationScenario = {
  id: string;
  title: string;
  description: string;
  input: InitializationInput;
  initializerConfig?: InitializerConfig;
  initializerConfigSummary: string;
};

const BOLOS_INPUT: InitializationInput = {
  appName: "BOLOS",
  dependencies: [],
  requireLatestFirmware: false,
  allowPartialDependencies: true,
};

const ETHEREUM_INPUT: InitializationInput = {
  appName: "Ethereum",
  dependencies: [],
  requireLatestFirmware: false,
  allowPartialDependencies: true,
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
  allowPartialDependencies: true,
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

export const INITIALIZATION_SCENARIOS: InitializationScenario[] = [
  {
    id: "bolos-dashboard",
    title: "BOLOS dashboard",
    description:
      "Opens the dashboard without derivation. Expect a successful context with no derivedAddress.",
    input: BOLOS_INPUT,
    initializerConfigSummary: "Default initializer dependencies.",
  },
  {
    id: "ethereum-derivation",
    title: "Ethereum derivation",
    description:
      "Opens Ethereum and derives 44'/60'/0'/0/0. Expect derivedAddress to be populated.",
    input: ETHEREUM_INPUT,
    initializerConfigSummary: "Default initializer dependencies.",
  },
  {
    id: "bitcoin-derivation",
    title: "Bitcoin derivation",
    description:
      "Opens Bitcoin and derives native segwit 84'/0'/0'/0/0. Expect derivedAddress to be populated.",
    input: BITCOIN_INPUT,
    initializerConfigSummary: "Default initializer dependencies.",
  },
  {
    id: "ethereum-forced-min-app",
    title: "Ethereum forced min app",
    description:
      "Injects a high Ethereum min version to exercise app version handling and install/update states.",
    input: ETHEREUM_INPUT,
    initializerConfig: {
      dependencies: {
        getMinVersion: appName => (appName === "Ethereum" ? "99.99.99" : undefined),
      },
    },
    initializerConfigSummary: 'getMinVersion("Ethereum") returns 99.99.99.',
  },
  {
    id: "ethereum-deprecation-warning",
    title: "Ethereum deprecation warning",
    description:
      "Injects a past warning deprecation config for Ethereum send. Expect a deprecation warning UI before the echo intent runs.",
    input: {
      ...ETHEREUM_INPUT,
      deprecation: {
        flow: FlowName.send,
        currencyName: "Ethereum",
      },
    },
    initializerConfig: {
      dependencies: {
        getDeprecationConfig: () =>
          deprecatedDeviceModels.map(deviceModelId => ({
            deviceModelId,
            warningScreen: {
              date: PAST_DATE,
              deprecatedFlow: [FlowName.send],
            },
            warningClearSigningScreen: {
              date: FUTURE_DATE,
              deprecatedFlow: [],
              exception: [],
            },
            errorScreen: {
              date: FUTURE_DATE,
              deprecatedFlow: [],
              exception: [],
            },
          })),
      },
    },
    initializerConfigSummary:
      "getDeprecationConfig returns a past warning screen for Ethereum send on all supported models.",
  },
];
