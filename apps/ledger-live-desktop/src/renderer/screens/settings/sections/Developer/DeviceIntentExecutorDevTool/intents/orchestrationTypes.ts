import type { Intent } from "@features/platform-device-intent";
import type { InitializationInput } from "LLD/components/DeviceIntentExecutor";
import type {
  GetAddressLegacyTransportCompatDemoIntent,
  GetAddressLegacyTransportCompatDemoIntentExtraProps,
  GetAddressLegacyTransportCompatDemoIntentInput,
  GetAddressLegacyTransportCompatDemoIntentJobState,
  GetAddressLegacyTransportCompatDemoIntentPlatformDefinition,
} from "./getAddressLegacyTransportCompatDemoIntent/types";
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
  | GetAddressLegacyTransportCompatDemoIntentJobState
  | GetEthAddressDMKSignerDemoIntentJobState
  | UninstallAppDemoIntentJobState;

export type AnyDemoInput =
  | TimerDemoIntentInput
  | GetAddressLegacyTransportCompatDemoIntentInput
  | GetEthAddressDMKSignerDemoIntentInput
  | UninstallAppDemoIntentInput;

export type AnyDemoExtraProps =
  | TimerDemoIntentExtraProps
  | GetAddressLegacyTransportCompatDemoIntentExtraProps
  | GetEthAddressDMKSignerDemoIntentExtraProps
  | UninstallAppDemoIntentExtraProps;

export type AnyDemoIntent = Intent<AnyDemoJobState, AnyDemoInput, AnyDemoExtraProps>;

export type DemoIntentDefinitions = {
  timer: TimerDemoIntentPlatformDefinition;
  getAddressLegacyTransportCompat: GetAddressLegacyTransportCompatDemoIntentPlatformDefinition;
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
      "legacy-transport-compat-get-address-eth",
      GetAddressLegacyTransportCompatDemoIntent,
      GetAddressLegacyTransportCompatDemoIntentExtraProps
    >
  | PhaseOf<
      "legacy-transport-compat-get-address-btc",
      GetAddressLegacyTransportCompatDemoIntent,
      GetAddressLegacyTransportCompatDemoIntentExtraProps
    >
  | PhaseOf<
      "dmk-get-address",
      GetEthAddressDMKSignerDemoIntent,
      GetEthAddressDMKSignerDemoIntentExtraProps
    >
  | PhaseOf<"uninstall-eth", UninstallAppDemoIntent, UninstallAppDemoIntentExtraProps>
  | PhaseOf<"uninstall-btc", UninstallAppDemoIntent, UninstallAppDemoIntentExtraProps>
  | { phase: "completed" };
