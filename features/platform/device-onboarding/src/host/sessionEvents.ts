import type { DeviceSessionId } from "@ledgerhq/device-management-kit";
import type { OnboardingEvent } from "../types";

export const userEvents = [
  { type: "CONTINUE" },
  { type: "RETRY" },
  { type: "SKIP" },
  { type: "CLOSE" },
  { type: "QUIT" },
  { type: "USER_ACCEPT" },
  { type: "USER_DECLINE" },
] as const satisfies readonly OnboardingEvent[];

type SessionEvent = { type: "SESSION_READY" | "SESSION_CHANGED" | "FIRMWARE_UPDATE_FLOW_CLOSED" };

const sessionEventTypes = new Set<string>([
  "SESSION_READY",
  "SESSION_CHANGED",
  "FIRMWARE_UPDATE_FLOW_CLOSED",
]);

/** What a host or the devtool sends. The session events have no id: only the host knows it. */
export type HostOnboardingEvent = Exclude<OnboardingEvent, SessionEvent> | SessionEvent;

/** Whole rather than by type: `snapshot.can` needs the payload, and the machine dereferences it. */
export interface SendableOnboardingEvent {
  /** The host adds the session id to SESSION_READY: only it knows the live session. */
  readonly event: HostOnboardingEvent;
  readonly label?: string;
}

function isSessionEvent(event: HostOnboardingEvent): event is SessionEvent {
  return sessionEventTypes.has(event.type);
}

/** Adds the live session id to the session events. `sessionId` is read only for them. */
export function stampSession(
  event: HostOnboardingEvent,
  sessionId: () => DeviceSessionId,
): OnboardingEvent {
  return isSessionEvent(event) ? { type: event.type, sessionId: sessionId() } : event;
}
