import type {
  DeviceOnboardingExitReason,
  OnboardingEvent,
  OnboardingStep,
} from "@ledgerhq/device-onboarding";

export const DeviceOnboardingStatus = {
  Idle: "idle",
  Connecting: "connecting",
  Running: "running",
  Exited: "exited",
} as const;

export type DeviceOnboardingStatus =
  (typeof DeviceOnboardingStatus)[keyof typeof DeviceOnboardingStatus];

export interface DeviceOnboardingToolDevice {
  readonly name: string;
  readonly modelId: string;
  readonly sessionId: string;
  readonly wired: boolean;
}

/**
 * The machine's `device.id` is deliberately absent: it is a persistent hardware identifier, and
 * `sessionId` already tells two runs apart.
 */
export interface DeviceOnboardingToolExit {
  readonly reason: DeviceOnboardingExitReason;
  readonly sessionId: string;
  readonly modelId: string;
}

/** Closed rather than free text, so a host cannot label an event with the seed progress. */
export type DeviceOnboardingToolDetail =
  | { readonly kind: "step"; readonly step: OnboardingStep }
  | { readonly kind: "firmware"; readonly version: string }
  | { readonly kind: "session"; readonly sessionId: string };

export type DeviceOnboardingToolPayload =
  | string
  | number
  | boolean
  | null
  | { readonly [key: string]: DeviceOnboardingToolPayload };

export interface DeviceOnboardingToolEvent {
  /** Unique across the run: the view keys on it. */
  readonly id: string;
  readonly type: OnboardingEvent["type"];
  /** Epoch milliseconds. */
  readonly at: number;
  readonly detail?: DeviceOnboardingToolDetail;
  /** Plain fields of the event. The screen lists them when the line is opened. */
  readonly payload?: DeviceOnboardingToolPayload;
}

/** A state this step can reach. `auto` means the machine may move there with no event. */
export interface DeviceOnboardingNextState {
  readonly event: string;
  readonly state: string;
}

/** Whole rather than by type: `snapshot.can` needs the payload, and the machine dereferences it. */
export interface SendableOnboardingEvent {
  readonly event: OnboardingEvent;
  readonly label?: string;
}

/**
 * What the panel prints, in display order. Closed, so seed progress stays off this list.
 * A host flattens the machine onto these names.
 */
export const watchedContextFields = [
  "deviceModelId",
  "offerSync",
  "isOnboarded",
  "onboardedOnEntry",
  "isInRecoveryMode",
  "managerAllowed",
  "currentOnboardingStep",
  "currentSetupStep",
  "firmwareVersion",
  "availableFirmwareVersion",
  "firmwareChecked",
  "onEarlyCheckScreen",
  "secureConnectionRequested",
  "isGenuine",
  "verdictMatchesSession",
  "genuineFailureKind",
  "checksPaused",
] as const;

export type DeviceOnboardingWatchedField = (typeof watchedContextFields)[number];

export type DeviceOnboardingToolContext = Readonly<
  Partial<Record<DeviceOnboardingWatchedField, string | number | boolean | null>>
>;

export interface DeviceOnboardingToolProps {
  readonly status: DeviceOnboardingStatus;
  /** Null while `running` means the transport went away, which re-enables Connect. */
  readonly device: DeviceOnboardingToolDevice | null;
  /** Dotted state value, null until the machine starts. */
  readonly state: string | null;
  readonly context: DeviceOnboardingToolContext | null;
  /** A new array on every append: the tool recomputes on render, it does not watch for mutation. */
  readonly events: readonly DeviceOnboardingToolEvent[];
  readonly exit: DeviceOnboardingToolExit | null;
  /** Only events the host has already made valid: `SESSION_READY` after it re-opened the session. */
  readonly sendableEvents: readonly SendableOnboardingEvent[];
  /** States this step can reach. Guards have not picked one yet. */
  readonly nextStates: readonly DeviceOnboardingNextState[];
  /** Set when the host failed to connect a device or to start the flow. Re-enables Connect. */
  readonly error: string | null;
  /** Opens a session: the first one, or a replacement once the transport went away. */
  readonly connect: () => void;
  readonly send: (event: OnboardingEvent) => void;
  readonly reset: () => void;
}
