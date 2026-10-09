import { useEffect, useState } from "react";
import type { HostOnboardingEvent, OnboardingEvent } from "@ledgerhq/device-onboarding";
import {
  DeviceOnboardingStatus,
  type DeviceOnboardingFeatureFlag,
  type DeviceOnboardingLogRow,
  type DeviceOnboardingNextState,
  type DeviceOnboardingToolEvent,
  type DeviceOnboardingToolPayload,
  type DeviceOnboardingToolProps,
} from "../types";
import { logCopy, overrideCopy, statusCopy } from "./configCopy";

const displayedEventCount = 40;
const displayedDetailLength = 80;
const displayedPayloadRows = 80;

export interface NextStateGroup {
  readonly event: string;
  readonly states: string[];
}

function groupByEvent(rows: readonly DeviceOnboardingNextState[]): NextStateGroup[] {
  const groups: { event: string; states: string[] }[] = [];

  for (const row of rows) {
    const group = groups.find(item => item.event === row.event);
    if (group) {
      group.states.push(row.state);
    } else {
      groups.push({ event: row.event, states: [row.state] });
    }
  }

  return groups;
}

const DeviceLink = {
  Usb: "USB",
  Ble: "BLE",
} as const;

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
  readonly event: HostOnboardingEvent;
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

function rowsFor(
  log: readonly DeviceOnboardingLogRow[],
  state: string | null,
): readonly DeviceOnboardingLogRow[] {
  if (state === null) return [];
  if (log.at(-1)?.state === state) return log;
  return [...log, { state }];
}

export interface SwitchRow {
  readonly key: string;
  readonly label: string;
  readonly checked: boolean;
  readonly onChange: (checked: boolean) => void;
}

export interface OverrideRow {
  readonly key: string;
  readonly label: string;
  readonly value: string;
  readonly options: readonly { readonly value: string; readonly label: string }[];
  readonly onChange: (value: string) => void;
}

export interface DeviceOnboardingViewModel {
  readonly statusLabel: string;
  readonly exportLogs: () => string;
  readonly logLines: readonly LogLine[];
  readonly deviceLabel: string | null;
  readonly isRunning: boolean;
  readonly contextRows: readonly DisplayRow[];
  readonly sendableRows: readonly SendableRow[];
  readonly nextStateGroups: readonly NextStateGroup[];
  readonly logIsEmpty: boolean;
  readonly error: string | null;
  readonly canConnect: boolean;
  readonly canSend: boolean;
  readonly canReset: boolean;
  readonly connect: () => void;
  readonly send: (event: HostOnboardingEvent) => void;
  readonly reset: () => void;
  readonly showNextScreen: boolean;
  /** Absent when the host has no next screen to open: the switch is hidden. */
  readonly setShowNextScreen?: (showNextScreen: boolean) => void;
  /** Empty when the host has no feature flag: the section is hidden. */
  readonly featureFlagRows: readonly SwitchRow[];
  readonly overrideRows: readonly OverrideRow[];
}

export const GenuineOverride = {
  Device: "device",
  Genuine: "genuine",
  Fail: "fail",
} as const;

export type GenuineOverride = (typeof GenuineOverride)[keyof typeof GenuineOverride];

export const FirmwareOverride = {
  Device: "device",
  UpToDate: "upToDate",
  Outdated: "outdated",
} as const;

export type FirmwareOverride = (typeof FirmwareOverride)[keyof typeof FirmwareOverride];

type FirmwareAnswer = Extract<OnboardingEvent, { type: "FIRMWARE_UP_TO_DATE" }>["output"];

// The machine reads only the update, so the made-up answer carries no more than its versions.
const overrideFirmware = {
  firmwareVersion: { os: "override", mcu: "override", bootloader: "override" },
  firmwareUpdateContext: {},
} as FirmwareAnswer;

const overrideUpdate = {
  osuFirmware: {
    id: 0,
    notes: null,
    perso: "override",
    firmware: "override",
    firmwareKey: "override",
    hash: null,
    nextFinalFirmware: 0,
  },
  finalFirmware: {
    id: 0,
    version: "override",
    perso: "override",
    firmware: null,
    firmwareKey: null,
    hash: null,
    bytes: null,
    mcuVersions: [],
  },
  mcuUpdateRequired: false,
};

function overrideEvent(
  state: string | null,
  genuine: GenuineOverride,
  firmware: FirmwareOverride,
): OnboardingEvent | null {
  const inGenuineCheck = state?.startsWith("checks.genuineCheck") ?? false;
  if (inGenuineCheck && genuine === GenuineOverride.Genuine) {
    return { type: "GENUINE_CHECK_PASSED", output: { isGenuine: true } };
  }
  if (inGenuineCheck && genuine === GenuineOverride.Fail) {
    return { type: "DEVICE_NOT_GENUINE", output: { isGenuine: false } };
  }
  if (state === "checks.firmwareCheck" && firmware === FirmwareOverride.UpToDate) {
    return { type: "FIRMWARE_UP_TO_DATE", output: overrideFirmware };
  }
  if (state === "checks.firmwareCheck" && firmware === FirmwareOverride.Outdated) {
    return {
      type: "FIRMWARE_UPDATE_AVAILABLE",
      output: { ...overrideFirmware, update: overrideUpdate },
    };
  }
  return null;
}

function payloadRowsOf(payload: DeviceOnboardingToolPayload | undefined): DisplayRow[] {
  const rows: DisplayRow[] = [];
  if (payload && typeof payload === "object" && walkPayload(payload, "", rows)) {
    rows.push({ label: logCopy.more, value: logCopy.moreFields });
  }
  return rows;
}

/** Returns true when it stopped at the row limit, so the caller adds "more fields" once. */
function walkPayload(
  value: DeviceOnboardingToolPayload & object,
  path: string,
  rows: DisplayRow[],
): boolean {
  for (const [key, child] of Object.entries(value)) {
    if (rows.length >= displayedPayloadRows) return true;
    const next = path === "" ? key : `${path}.${key}`;
    if (child === null || typeof child !== "object") {
      rows.push({ label: next, value: formatValue(child) });
    } else if (walkPayload(child, next, rows)) {
      return true;
    }
  }
  return false;
}

export function featureFlagRows(
  flag: DeviceOnboardingFeatureFlag | undefined,
  setFlag: ((flag: DeviceOnboardingFeatureFlag) => void) | undefined,
): SwitchRow[] {
  if (!flag || !setFlag) return [];

  return [
    {
      key: "enabled",
      label: "enabled",
      checked: flag.enabled,
      onChange: enabled => setFlag({ ...flag, enabled }),
    },
    ...Object.entries(flag.params).map(([name, value]) => ({
      key: `params.${name}`,
      label: `params.${name}`,
      checked: value,
      onChange: (checked: boolean) =>
        setFlag({ ...flag, params: { ...flag.params, [name]: checked } }),
    })),
  ];
}

export function formatValue(value: string | number | boolean | null): string {
  return value === "" ? "—" : String(value);
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

function withExitOnQuit(lines: readonly LogLine[], exitRows: readonly DisplayRow[]): LogLine[] {
  if (exitRows.length === 0) return [...lines];

  const quitIndex = lines.findIndex(line => line.line === "event" && line.type === "QUIT");
  const quit = lines[quitIndex];
  if (quit?.line !== "event") return [...lines];

  const next = lines.slice();
  next[quitIndex] = { ...quit, payload: [...quit.payload, ...exitRows] };
  return next;
}

function logLinesOf(rows: readonly DeviceOnboardingLogRow[]): LogLine[] {
  const shown = rows.slice(-displayedEventCount);
  const lines: LogLine[] = [];

  for (let index = shown.length - 1; index >= 0; index -= 1) {
    const row = shown[index];
    const newer = shown[index + 1];
    if (newer === undefined || newer.state !== row.state) {
      lines.push({
        line: "state",
        key: `${index}-${row.state}`,
        label: row.state,
        kind: stateKind(row.state),
        isCurrent: newer === undefined,
      });
    }
    if (row.event) lines.push(eventLine(row.event));
  }

  return lines;
}

export function useDeviceOnboardingViewModel(
  props: DeviceOnboardingToolProps,
): DeviceOnboardingViewModel {
  const {
    status,
    device,
    state,
    context,
    log,
    exit,
    sendableEvents,
    nextStates,
    error,
    showNextScreen,
    setShowNextScreen,
    featureFlag,
    setFeatureFlag,
    send,
  } = props;

  const [genuineOverride, setGenuineOverride] = useState<GenuineOverride>(GenuineOverride.Device);
  const [firmwareOverride, setFirmwareOverride] = useState<FirmwareOverride>(
    FirmwareOverride.Device,
  );
  useEffect(() => {
    const event = overrideEvent(state, genuineOverride, firmwareOverride);
    if (event) send(event);
  }, [firmwareOverride, genuineOverride, send, state]);

  const rows = rowsFor(log, state);
  const exitRows: DisplayRow[] =
    exit === null
      ? []
      : [
          { label: "sessionId", value: formatValue(exit.sessionId) },
          { label: "modelId", value: formatValue(exit.modelId) },
        ];
  const logLines = withExitOnQuit(logLinesOf(rows), exitRows);
  const contextRows = payloadRowsOf(context ?? undefined);

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
    statusLabel: statusCopy[status],
    exportLogs: () => JSON.stringify({ status, device, state, context, log, exit }, null, 2),
    logLines,
    deviceLabel,
    isRunning: status === DeviceOnboardingStatus.Running,
    contextRows,
    sendableRows,
    nextStateGroups: groupByEvent(nextStates),
    // The host offers events and next states only while the machine runs, so they come with a log.
    logIsEmpty: logLines.length === 0,
    error,
    canConnect:
      status === DeviceOnboardingStatus.Idle ||
      status === DeviceOnboardingStatus.Exited ||
      (status === DeviceOnboardingStatus.Connecting && error !== null) ||
      transportWentAwayMidRun,
    canSend: status === DeviceOnboardingStatus.Running && device !== null,
    canReset: status !== DeviceOnboardingStatus.Idle,
    connect: props.connect,
    send,
    reset: props.reset,
    showNextScreen: showNextScreen ?? false,
    setShowNextScreen,
    featureFlagRows: featureFlagRows(featureFlag, setFeatureFlag),
    overrideRows: [
      {
        key: "genuine",
        label: overrideCopy.genuine,
        value: genuineOverride,
        options: [
          { value: GenuineOverride.Device, label: overrideCopy.device },
          { value: GenuineOverride.Genuine, label: overrideCopy.isGenuine },
          { value: GenuineOverride.Fail, label: overrideCopy.fail },
        ],
        onChange: value => setGenuineOverride(value as GenuineOverride),
      },
      {
        key: "firmware",
        label: overrideCopy.firmware,
        value: firmwareOverride,
        options: [
          { value: FirmwareOverride.Device, label: overrideCopy.device },
          { value: FirmwareOverride.UpToDate, label: overrideCopy.upToDate },
          { value: FirmwareOverride.Outdated, label: overrideCopy.outdated },
        ],
        onChange: value => setFirmwareOverride(value as FirmwareOverride),
      },
    ],
  };
}
