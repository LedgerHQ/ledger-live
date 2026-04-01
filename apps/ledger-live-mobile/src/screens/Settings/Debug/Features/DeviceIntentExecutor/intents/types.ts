import type { Intent, RequiredDeviceContext } from "@ledgerhq/device-intent";
import type {
  TimerDemoIntentDef,
  TimerJobState,
  TimerInput,
  TimerExtraProps,
} from "./timerDemoIntent";
import type {
  GetAddressLegacyWithDeviceDemoIntentDef,
  GetAddressLegacyWithDeviceJobState,
  GetAddressLegacyWithDeviceInput,
  GetAddressLegacyWithDeviceExtraProps,
} from "./getAddressLegacyWithDeviceDemoIntent";
import type {
  GetEthAddressDMKSignerDemoIntentDef,
  GetEthAddressDMKSignerJobState,
  GetEthAddressDMKSignerInput,
  GetEthAddressDMKSignerExtraProps,
} from "./getEthAddressDMKSignerDemoIntent";
import type {
  UninstallAppDemoIntentDef,
  UninstallAppJobState,
  UninstallAppInput,
  UninstallAppExtraProps,
} from "./uninstallAppDemoIntent";

export type { TimerJobState, TimerInput, TimerExtraProps } from "./timerDemoIntent";
export type {
  GetAddressLegacyWithDeviceJobState,
  GetAddressLegacyWithDeviceInput,
  GetAddressLegacyWithDeviceExtraProps,
} from "./getAddressLegacyWithDeviceDemoIntent";
export type {
  GetEthAddressDMKSignerJobState,
  GetEthAddressDMKSignerInput,
  GetEthAddressDMKSignerExtraProps,
} from "./getEthAddressDMKSignerDemoIntent";
export type {
  UninstallAppJobState,
  UninstallAppInput,
  UninstallAppExtraProps,
} from "./uninstallAppDemoIntent";

// ---------------------------------------------------------------------------
// Union of all job states
// ---------------------------------------------------------------------------

export type AnyDemoJobState =
  | TimerJobState
  | GetAddressLegacyWithDeviceJobState
  | GetEthAddressDMKSignerJobState
  | UninstallAppJobState;

// ---------------------------------------------------------------------------
// Union of all inputs
// ---------------------------------------------------------------------------

export type AnyDemoInput =
  | TimerInput
  | GetAddressLegacyWithDeviceInput
  | GetEthAddressDMKSignerInput
  | UninstallAppInput
  | undefined;

// ---------------------------------------------------------------------------
// ExtraProps — per-intent specific types assembled as a union
// ---------------------------------------------------------------------------

export type AnyDemoExtraProps =
  | TimerExtraProps
  | GetAddressLegacyWithDeviceExtraProps
  | GetEthAddressDMKSignerExtraProps
  | UninstallAppExtraProps;

// ---------------------------------------------------------------------------
// Intent union type
// ---------------------------------------------------------------------------

export type AnyDemoIntent = Intent<AnyDemoJobState, AnyDemoInput, AnyDemoExtraProps>;

// ---------------------------------------------------------------------------
// Injected intent definitions — the caller provides concrete implementations
// ---------------------------------------------------------------------------

export type DemoIntentDefinitions = {
  timer: TimerDemoIntentDef;
  getAddressLegacyWithDevice: GetAddressLegacyWithDeviceDemoIntentDef;
  getEthAddressDMKSigner: GetEthAddressDMKSignerDemoIntentDef;
  uninstallApp: UninstallAppDemoIntentDef;
};

// ---------------------------------------------------------------------------
// Discriminated union phase — each variant carries exact types
// ---------------------------------------------------------------------------

type PhaseOf<P extends string, JS, I, EP> = {
  phase: P;
  intent: Intent<JS, I, EP>;
  extraProps: EP;
  requiredContext: RequiredDeviceContext;
};

export type DemoPhase =
  | { phase: "idle" }
  | PhaseOf<"timer", TimerJobState, TimerInput, TimerExtraProps>
  | PhaseOf<"legacy-get-address-eth", GetAddressLegacyWithDeviceJobState, GetAddressLegacyWithDeviceInput, GetAddressLegacyWithDeviceExtraProps>
  | PhaseOf<"legacy-get-address-btc", GetAddressLegacyWithDeviceJobState, GetAddressLegacyWithDeviceInput, GetAddressLegacyWithDeviceExtraProps>
  | PhaseOf<"dmk-get-address", GetEthAddressDMKSignerJobState, GetEthAddressDMKSignerInput, GetEthAddressDMKSignerExtraProps>
  | PhaseOf<"uninstall-eth", UninstallAppJobState, UninstallAppInput, UninstallAppExtraProps>
  | PhaseOf<"uninstall-btc", UninstallAppJobState, UninstallAppInput, UninstallAppExtraProps>
  | { phase: "completed" };
