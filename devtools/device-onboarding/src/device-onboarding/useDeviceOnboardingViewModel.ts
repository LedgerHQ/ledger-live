import { useEffect, useRef, useState } from "react";
import type { OnboardingEvent } from "@ledgerhq/device-onboarding";
import {
  DeviceOnboardingStatus,
  watchedContextFields,
  type DeviceOnboardingNextState,
  type DeviceOnboardingToolEvent,
  type DeviceOnboardingToolPayload,
  type DeviceOnboardingToolProps,
} from "../types";

const displayedEventCount = 40;
const displayedDetailLength = 80;
const displayedStateCount = 24;

const DeviceLink = {
  Usb: "USB",
  Ble: "BLE",
} as const;

const statusLabels: Record<DeviceOnboardingStatus, string> = {
  [DeviceOnboardingStatus.Idle]: "Not started",
  [DeviceOnboardingStatus.Connecting]: "Connecting…",
  [DeviceOnboardingStatus.Running]: "Running",
  [DeviceOnboardingStatus.Exited]: "Exited",
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
  readonly payload: readonly DisplayRow[];
}

export interface SendableRow {
  readonly key: string;
  readonly label: string;
  readonly event: OnboardingEvent;
}

export const StateKind = {
  Progress: "progress",
  Genuine: "genuine",
  Firmware: "firmware",
  Setup: "setup",
  Locked: "locked",
  Session: "session",
  Failed: "failed",
  Succeeded: "succeeded",
  Quit: "quit",
} as const;

export type StateKind = (typeof StateKind)[keyof typeof StateKind];

export interface StateStep {
  readonly key: string;
  readonly label: string;
  readonly kind: StateKind;
  readonly isCurrent: boolean;
}

const MachineState = {
  GenuineFailed: "checks.genuineFailed",
  FirmwareCheckFailed: "checks.firmwareCheckFailed",
  NotGenuineSupport: "checks.notGenuineSupport",
  LegacyFallback: "legacyFallback",
  BootloaderRecovery: "bootloaderRecovery",
  ChecksDone: "checks.checksDone",
  ChecksSucceeded: "checks.checksSucceeded",
  OnboardedExit: "onboardedExit",
  SyncOffer: "syncOffer",
  Done: "done",
  Quitting: "quitting",
  LeavingOnQuit: "leavingOnQuit",
  ExitOnboarding: "exitOnboarding",
  DeviceLocked: "deviceLocked",
  AwaitingSession: "awaitingSession",
  DeviceSetupPrefix: "deviceSetup.",
} as const;

const failedStates = new Set<string>([
  MachineState.GenuineFailed,
  MachineState.FirmwareCheckFailed,
  MachineState.NotGenuineSupport,
  MachineState.LegacyFallback,
  MachineState.BootloaderRecovery,
]);
const succeededStates = new Set<string>([
  MachineState.ChecksDone,
  MachineState.ChecksSucceeded,
  MachineState.OnboardedExit,
  MachineState.SyncOffer,
  MachineState.Done,
]);
const quitStates = new Set<string>([
  MachineState.Quitting,
  MachineState.LeavingOnQuit,
  MachineState.ExitOnboarding,
]);
const firmwarePattern = /firmware/i;
const genuinePattern = /genuine|earlycheck/i;

export function stateKind(state: string): StateKind {
  if (failedStates.has(state)) return StateKind.Failed;
  if (succeededStates.has(state)) return StateKind.Succeeded;
  if (quitStates.has(state)) return StateKind.Quit;
  if (state === MachineState.DeviceLocked) return StateKind.Locked;
  if (state === MachineState.AwaitingSession) return StateKind.Session;
  if (state.startsWith(MachineState.DeviceSetupPrefix)) return StateKind.Setup;
  if (firmwarePattern.test(state)) return StateKind.Firmware;
  if (genuinePattern.test(state)) return StateKind.Genuine;
  return StateKind.Progress;
}

export type LogLine =
  | (StateStep & { readonly line: "state" })
  | (EventRow & { readonly line: "event" });

interface TrailStep {
  readonly label: string;
  readonly events: readonly DeviceOnboardingToolEvent[];
}

interface Trail {
  readonly steps: readonly TrailStep[];
  readonly open: readonly DeviceOnboardingToolEvent[];
}

const emptyTrail: Trail = { steps: [], open: [] };

export interface DeviceOnboardingViewModel {
  readonly statusLabel: string;
  readonly stateSteps: readonly StateStep[];
  readonly logLines: readonly LogLine[];
  readonly deviceLabel: string | null;
  readonly isRunning: boolean;
  readonly contextRows: readonly DisplayRow[];
  readonly exitRows: readonly DisplayRow[];
  readonly sendableRows: readonly SendableRow[];
  readonly nextStates: readonly DeviceOnboardingNextState[];
  readonly error: string | null;
  readonly canConnect: boolean;
  readonly canSend: boolean;
  readonly canReset: boolean;
  readonly connect: () => void;
  readonly send: (event: OnboardingEvent) => void;
  readonly reset: () => void;
}

const hiddenPayloadKeys = new Set(["failure", "deviceId", "dmk", "ports"]);

function payloadRowsOf(payload: DeviceOnboardingToolPayload | undefined): DisplayRow[] {
  const rows: DisplayRow[] = [];
  if (payload && typeof payload === "object") walkPayload(payload, "", rows);
  return rows;
}

function walkPayload(value: DeviceOnboardingToolPayload, path: string, rows: DisplayRow[]) {
  if (value === null || typeof value !== "object") {
    if (path === "" || (typeof value === "string" && value.includes("://"))) return;
    rows.push({ label: path, value: formatValue(value) });
    return;
  }

  for (const [key, child] of Object.entries(value)) {
    if (hiddenPayloadKeys.has(key) || child === undefined) continue;
    const next = path === "" ? key : `${path}.${key}`;
    if (child === null || typeof child !== "object") {
      if (typeof child === "string" && child.includes("://")) continue;
      rows.push({ label: next, value: formatValue(child) });
    } else {
      walkPayload(child, next, rows);
    }
  }
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

function newestFirst(events: readonly DeviceOnboardingToolEvent[]): DeviceOnboardingToolEvent[] {
  return events
    .map((event, index) => ({ event, index }))
    .sort(
      (left, right) => orderOf(right.event.at) - orderOf(left.event.at) || right.index - left.index,
    )
    .slice(0, displayedEventCount)
    .map(({ event }) => event);
}

function eventLine(event: DeviceOnboardingToolEvent): LogLine {
  return {
    line: "event",
    id: event.id,
    type: event.type,
    time: formatTime(event.at),
    detail: formatDetail(event.detail)?.slice(0, displayedDetailLength) ?? null,
    payload: payloadRowsOf(event.payload),
  };
}

function logLinesOf(trail: Trail): LogLine[] {
  const lines: LogLine[] = [];

  for (let index = trail.steps.length - 1; index >= 0; index -= 1) {
    const step = trail.steps[index];
    lines.push({
      line: "state",
      key: `${index}-${step.label}`,
      label: step.label,
      kind: stateKind(step.label),
      isCurrent: index === trail.steps.length - 1,
    });

    const between =
      index === trail.steps.length - 1 ? [...step.events, ...trail.open] : step.events;
    for (const event of newestFirst(between)) lines.push(eventLine(event));
  }

  return lines;
}

export function useDeviceOnboardingViewModel(
  props: DeviceOnboardingToolProps,
): DeviceOnboardingViewModel {
  const { status, device, state, context, events, exit, sendableEvents, nextStates, error } = props;

  const seenEventIds = useRef(new Set<string>());
  const [trail, setTrail] = useState<Trail>(emptyTrail);

  useEffect(() => {
    if (!state) {
      seenEventIds.current = new Set();
      setTrail(current =>
        current.steps.length === 0 && current.open.length === 0 ? current : emptyTrail,
      );
      return;
    }

    const fresh = events.filter(event => !seenEventIds.current.has(event.id));
    for (const event of fresh) seenEventIds.current.add(event.id);

    setTrail(current => {
      const last = current.steps.at(-1);
      if (last?.label === state) {
        if (fresh.length === 0) return current;
        return { steps: current.steps, open: [...current.open, ...fresh] };
      }

      return {
        steps: [...current.steps, { label: state, events: [...current.open, ...fresh] }].slice(
          -displayedStateCount,
        ),
        open: [],
      };
    });
  }, [state, events]);

  const stateSteps: StateStep[] = trail.steps.map((step, index) => ({
    key: `${index}-${step.label}`,
    label: step.label,
    kind: stateKind(step.label),
    isCurrent: index === trail.steps.length - 1,
  }));

  const logLines = logLinesOf(trail);
  const contextRows: DisplayRow[] =
    context === null
      ? []
      : watchedContextFields
          .filter(field => context[field] !== undefined)
          .map(field => ({ label: field, value: formatValue(context[field]) }));

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
    const transport = device.wired ? DeviceLink.Usb : DeviceLink.Ble;
    deviceLabel = `${device.name} · ${device.modelId} · ${transport} · ${device.sessionId}`;
  }

  const transportWentAwayMidRun = status === DeviceOnboardingStatus.Running && device === null;

  return {
    statusLabel: statusLabels[status],
    stateSteps,
    logLines,
    deviceLabel,
    isRunning: status === DeviceOnboardingStatus.Running,
    contextRows,
    exitRows,
    sendableRows,
    nextStates,
    error,
    canConnect:
      status === DeviceOnboardingStatus.Idle ||
      status === DeviceOnboardingStatus.Exited ||
      (status === DeviceOnboardingStatus.Connecting && error !== null) ||
      transportWentAwayMidRun,
    canSend: status === DeviceOnboardingStatus.Running && device !== null,
    canReset: status !== DeviceOnboardingStatus.Idle,
    connect: props.connect,
    send: props.send,
    reset: props.reset,
  };
}
