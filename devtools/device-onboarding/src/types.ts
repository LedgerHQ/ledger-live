import type {
  DeviceOnboardingExitReason,
  HostLogRow,
  HostNextState,
  HostOnboardingEvent,
  HostToolEvent,
  HostToolEventDetail,
  HostToolPayload,
  WatchedOnboardingContext,
} from "@features/platform-device-onboarding";

export type DeviceOnboardingStatus = "idle" | "connecting" | "running" | "exited";

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
export type DeviceOnboardingToolDetail = HostToolEventDetail;
export type DeviceOnboardingToolPayload = HostToolPayload;
export type DeviceOnboardingToolEvent = HostToolEvent;
export type DeviceOnboardingLogRow = HostLogRow;
export type DeviceOnboardingNextState = HostNextState;

/** Whole rather than by type: `snapshot.can` needs the payload, and the machine dereferences it. */
export interface SendableOnboardingEvent {
  /** The host adds the session id to SESSION_READY: only it knows the live session. */
  readonly event: HostOnboardingEvent;
  readonly label?: string;
}

export interface DeviceOnboardingToolProps {
  readonly status: DeviceOnboardingStatus;
  /** Null while `running` means the transport went away, which re-enables Connect. */
  readonly device: DeviceOnboardingToolDevice | null;
  /** Dotted state value, null until the machine starts. */
  readonly state: string | null;
  /**
   * @deprecated Read `machineContext`. Flat names kept while app code still reads them; the tool
   * does not show it.
   */
  readonly context: WatchedOnboardingContext | null;
  /** The machine context as plain data, without private fields. The screen lists every field. */
  readonly machineContext: DeviceOnboardingToolPayload | null;
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
  readonly send: (event: HostOnboardingEvent) => void;
  readonly reset: () => void;
  /**
   * Devtool only. The app's `deviceOnboarding` feature flag. A host without the flag leaves both
   * out, and its switches are hidden.
   */
  readonly featureFlag?: DeviceOnboardingFeatureFlag;
  readonly setFeatureFlag?: (featureFlag: DeviceOnboardingFeatureFlag) => void;
  /** True when a local override replaces the resolved flag. Absent on a host that does not edit it. */
  readonly isFeatureFlagOverridden?: boolean;
  readonly resetFeatureFlag?: () => void;
}

/** Each param is a switch, so only boolean params are listed. */
export interface DeviceOnboardingFeatureFlag {
  readonly enabled: boolean;
  readonly params: Readonly<Record<string, boolean>>;
}
