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
  | readonly DeviceOnboardingToolPayload[]
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

/** One machine update. `event` is the event that led to `state`. */
export interface DeviceOnboardingLogRow {
  readonly state: string;
  readonly event?: DeviceOnboardingToolEvent;
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
 * What the panel prints, in display order. Closed, so a host cannot put seed progress on a screen
 * that runs during seed entry — see the README for the rest of the boundary.
 *
 * A host flattens the machine onto these names. The device-state fields come from `lastDeviceState`;
 * `availableFirmwareVersion` from `availableFirmwareUpdate.final.version`; `isGenuine` and
 * `verdictMatchesSession` from the raw `genuineVerdict`; `genuineFailureKind` from
 * `lastGenuineFailure.kind`. The rest read straight off the context.
 */
export const watchedContextFields = [
  "deviceModelId",
  "offerSync",
  "isOnboarded",
  "onboardedOnEntry",
  "isInRecoveryMode",
  "managerAllowed",
  "currentOnboardingStep",
  "recoveryKeyStatus",
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
  /** Saved from each machine update, in the order they happened. */
  readonly log: readonly DeviceOnboardingLogRow[];
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
  /**
   * Devtool only. When on, an exit or a firmware update opens the app's next screen, as the real
   * flow would. Off by default: a QA run must not complete the app onboarding or leave the devtool.
   * A host that has no next screen leaves both out, and the switch is hidden.
   */
  readonly showNextScreen?: boolean;
  readonly setShowNextScreen?: (showNextScreen: boolean) => void;
  /**
   * Devtool only. The app's `deviceOnboarding` feature flag. A host without the flag leaves both
   * out, and its switches are hidden.
   */
  readonly featureFlag?: DeviceOnboardingFeatureFlag;
  readonly setFeatureFlag?: (featureFlag: DeviceOnboardingFeatureFlag) => void;
}

/** Each param is a switch, so only boolean params are listed. */
export interface DeviceOnboardingFeatureFlag {
  readonly enabled: boolean;
  readonly params: Readonly<Record<string, boolean>>;
}
