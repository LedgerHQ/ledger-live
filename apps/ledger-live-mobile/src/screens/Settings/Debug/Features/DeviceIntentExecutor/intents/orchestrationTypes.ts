import type { Intent } from "@ledgerhq/device-intent";
import type { InitializationInput } from "LLM/components/DeviceIntentExecutor/types";
import type {
  GetAddressLegacyWithDeviceDemoIntent,
  GetAddressLegacyWithDeviceDemoIntentExtraProps,
  GetAddressLegacyWithDeviceDemoIntentInput,
  GetAddressLegacyWithDeviceDemoIntentJobState,
  GetAddressLegacyWithDeviceDemoIntentPlatformDefinition,
} from "./getAddressLegacyWithDeviceDemoIntent/types";
import type {
  GetEthAddressDMKSignerDemoIntent,
  GetEthAddressDMKSignerDemoIntentExtraProps,
  GetEthAddressDMKSignerDemoIntentInput,
  GetEthAddressDMKSignerDemoIntentJobState,
  GetEthAddressDMKSignerDemoIntentPlatformDefinition,
} from "./getEthAddressDMKSignerDemoIntent/types";
import type {
  TimerDemoIntent,
  TimerDemoIntentExtraProps,
  TimerDemoIntentInput,
  TimerDemoIntentJobState,
  TimerDemoIntentPlatformDefinition,
} from "./timerDemoIntent/types";
import type {
  UninstallAppDemoIntent,
  UninstallAppDemoIntentExtraProps,
  UninstallAppDemoIntentInput,
  UninstallAppDemoIntentJobState,
  UninstallAppDemoIntentPlatformDefinition,
} from "./uninstallAppDemoIntent/types";

export type AnyDemoJobState =
  | TimerDemoIntentJobState
  | GetAddressLegacyWithDeviceDemoIntentJobState
  | GetEthAddressDMKSignerDemoIntentJobState
  | UninstallAppDemoIntentJobState;

export type AnyDemoInput =
  | TimerDemoIntentInput
  | GetAddressLegacyWithDeviceDemoIntentInput
  | GetEthAddressDMKSignerDemoIntentInput
  | UninstallAppDemoIntentInput;

export type AnyDemoExtraProps =
  | TimerDemoIntentExtraProps
  | GetAddressLegacyWithDeviceDemoIntentExtraProps
  | GetEthAddressDMKSignerDemoIntentExtraProps
  | UninstallAppDemoIntentExtraProps;

export type AnyDemoIntent = Intent<AnyDemoJobState, AnyDemoInput, AnyDemoExtraProps>;

export type DemoIntentDefinitions = {
  timer: TimerDemoIntentPlatformDefinition;
  getAddressLegacyWithDevice: GetAddressLegacyWithDeviceDemoIntentPlatformDefinition;
  getEthAddressDMKSigner: GetEthAddressDMKSignerDemoIntentPlatformDefinition;
  uninstallApp: UninstallAppDemoIntentPlatformDefinition;
};

type PhaseOf<P extends string, I, EP extends AnyDemoExtraProps> = {
  phase: P;
  intent: I;
  extraProps: EP;
  deviceInitializationInput: InitializationInput;
};

export type DemoPhase =
  | { phase: "idle" }
  | PhaseOf<"timer", TimerDemoIntent, TimerDemoIntentExtraProps>
  | PhaseOf<
      "legacy-get-address-eth",
      GetAddressLegacyWithDeviceDemoIntent,
      GetAddressLegacyWithDeviceDemoIntentExtraProps
    >
  | PhaseOf<
      "legacy-get-address-btc",
      GetAddressLegacyWithDeviceDemoIntent,
      GetAddressLegacyWithDeviceDemoIntentExtraProps
    >
  | PhaseOf<
      "dmk-get-address",
      GetEthAddressDMKSignerDemoIntent,
      GetEthAddressDMKSignerDemoIntentExtraProps
    >
  | PhaseOf<"uninstall-eth", UninstallAppDemoIntent, UninstallAppDemoIntentExtraProps>
  | PhaseOf<"uninstall-btc", UninstallAppDemoIntent, UninstallAppDemoIntentExtraProps>
  | { phase: "completed" };
