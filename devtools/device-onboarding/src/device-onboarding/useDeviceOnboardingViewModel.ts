import { useEffect, useState } from "react";
import type { OnboardingEvent } from "@ledgerhq/device-onboarding";
import {
  watchedContextFields,
  type DeviceOnboardingStatus,
  type DeviceOnboardingToolEvent,
  type DeviceOnboardingToolProps,
} from "../types";

const displayedEventCount = 40;
const displayedDetailLength = 80;
const displayedStateCount = 24;

const statusLabels: Record<DeviceOnboardingStatus, string> = {
  idle: "Not started",
  connecting: "Connecting…",
  running: "Running",
  exited: "Exited",
};

export interface DisplayRow {
  readonly label: string;
  readonly value: string;
}

export interface EventRow {
  readonly id: string;
  readonly type: string;
  readonly time: string;
  readonly detail: string | null;
}

export interface SendableRow {
  readonly key: string;
  readonly label: string;
  readonly event: OnboardingEvent;
}

export type StateKind =
  | "progress"
  | "genuine"
  | "firmware"
  | "setup"
  | "locked"
  | "session"
  | "failed"
  | "succeeded"
  | "quit";

export interface StateStep {
  readonly key: string;
  readonly label: string;
  readonly kind: StateKind;
  readonly isCurrent: boolean;
}

const failedStates = new Set([
  "checks.genuineFailed",
  "checks.firmwareCheckFailed",
  "checks.notGenuineSupport",
  "legacyFallback",
  "bootloaderRecovery",
]);
const succeededStates = new Set([
  "checks.checksDone",
  "checks.checksSucceeded",
  "onboardedExit",
  "syncOffer",
  "done",
]);
const quitStates = new Set(["quitting", "leavingOnQuit", "exitOnboarding"]);
const firmwarePattern = /firmware/i;
const genuinePattern = /genuine|earlycheck/i;

export function stateKind(state: string): StateKind {
  if (failedStates.has(state)) return "failed";
  if (succeededStates.has(state)) return "succeeded";
  if (quitStates.has(state)) return "quit";
  if (state === "deviceLocked") return "locked";
  if (state === "awaitingSession") return "session";
  if (state.startsWith("deviceSetup.")) return "setup";
  if (firmwarePattern.test(state)) return "firmware";
  if (genuinePattern.test(state)) return "genuine";
  return "progress";
}

export interface DeviceOnboardingViewModel {
  readonly statusLabel: string;
  readonly stateSteps: readonly StateStep[];
  readonly deviceLabel: string | null;
  readonly isRunning: boolean;
  readonly contextRows: readonly DisplayRow[];
  readonly eventRows: readonly EventRow[];
  readonly exitRows: readonly DisplayRow[];
  readonly sendableRows: readonly SendableRow[];
  readonly error: string | null;
  readonly canConnect: boolean;
  readonly canSend: boolean;
  readonly canReset: boolean;
  readonly connect: () => void;
  readonly send: (event: OnboardingEvent) => void;
  readonly reset: () => void;
}

export function formatValue(value: string | number | boolean | null | undefined): string {
  if (value === undefined || value === "") {
    return "—";
  }

  const hostDefeatedTheType = value !== null && typeof value === "object";
  if (hostDefeatedTheType) {
    return "—";
  }

  return String(value);
}

function formatDetail(detail: DeviceOnboardingToolEvent["detail"]): string | null {
  if (detail === undefined) {
    return null;
  }

  switch (detail.kind) {
    case "step":
      return detail.step;
    case "firmware":
      return detail.version || null;
    case "session":
      return detail.sessionId || null;
  }
}

export function formatTime(at: number): string {
  const date = new Date(at);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  const time = [date.getHours(), date.getMinutes(), date.getSeconds()]
    .map(part => String(part).padStart(2, "0"))
    .join(":");

  return `${time}.${String(date.getMilliseconds()).padStart(3, "0")}`;
}

function orderOf(at: number): number {
  return Number.isFinite(at) ? at : 0;
}

export function useDeviceOnboardingViewModel(
  props: DeviceOnboardingToolProps,
): DeviceOnboardingViewModel {
  const { status, device, state, context, events, exit, sendableEvents, error } = props;

  const [visitedStates, setVisitedStates] = useState<readonly string[]>([]);

  useEffect(() => {
    setVisitedStates(current => {
      if (!state) {
        return current.length === 0 ? current : [];
      }
      if (current.at(-1) === state) {
        return current;
      }
      return [...current, state].slice(-displayedStateCount);
    });
  }, [state]);

  const stateSteps: StateStep[] = visitedStates.map((label, index) => ({
    key: `${index}-${label}`,
    label,
    kind: stateKind(label),
    isCurrent: index === visitedStates.length - 1,
  }));

  const contextRows: DisplayRow[] =
    context === null
      ? []
      : watchedContextFields
          .filter(field => context[field] !== undefined)
          .map(field => ({ label: field, value: formatValue(context[field]) }));

  const eventRows: EventRow[] = events
    .map((event, index) => ({ event, index }))
    .sort(
      (left, right) => orderOf(right.event.at) - orderOf(left.event.at) || right.index - left.index,
    )
    .slice(0, displayedEventCount)
    .map(({ event }) => ({
      id: event.id,
      type: event.type,
      time: formatTime(event.at),
      detail: formatDetail(event.detail)?.slice(0, displayedDetailLength) ?? null,
    }));

  const exitRows: DisplayRow[] =
    exit === null
      ? []
      : [
          { label: "reason", value: formatValue(exit.reason) },
          { label: "sessionId", value: formatValue(exit.sessionId) },
          { label: "modelId", value: formatValue(exit.modelId) },
        ];

  const sendableRows: SendableRow[] = sendableEvents.map((entry, index) => ({
    key: `${index}-${entry.event.type}`,
    label: entry.label ?? entry.event.type,
    event: entry.event,
  }));

  let deviceLabel = null;
  if (device !== null) {
    const transport = device.wired ? "USB" : "BLE";
    deviceLabel = `${device.name} · ${device.modelId} · ${transport} · ${device.sessionId}`;
  }

  const transportWentAwayMidRun = status === "running" && device === null;

  return {
    statusLabel: statusLabels[status],
    stateSteps,
    deviceLabel,
    isRunning: status === "running",
    contextRows,
    eventRows,
    exitRows,
    sendableRows,
    error,
    canConnect:
      status === "idle" ||
      status === "exited" ||
      (status === "connecting" && error !== null) ||
      transportWentAwayMidRun,
    canSend: status === "running" && device !== null,
    canReset: status !== "idle",
    connect: props.connect,
    send: props.send,
    reset: props.reset,
  };
}
