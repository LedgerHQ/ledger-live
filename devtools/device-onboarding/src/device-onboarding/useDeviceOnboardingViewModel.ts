import { useEffect, useState } from "react";
import type { HostOnboardingEvent, OnboardingEvent } from "@features/platform-device-onboarding";
import type {
  DeviceOnboardingFeatureFlag,
  DeviceOnboardingLogRow,
  DeviceOnboardingNextState,
  DeviceOnboardingToolEvent,
  DeviceOnboardingToolPayload,
  DeviceOnboardingToolProps,
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
  const groups = new Map<string, string[]>();
  for (const { event, state } of rows) groups.set(event, [...(groups.get(event) ?? []), state]);
  return [...groups].map(([event, states]) => ({ event, states }));
}

const DeviceLink = {
  Usb: "USB",
  Ble: "BLE",
} as const;

export interface DisplayRow {
  readonly label: string;
  readonly value: string;
  /**
   * Set for an object: the row opens on its fields, so a long path never runs off the screen. Its
   * `value` is the field count, a hint of what opening it shows.
   */
  readonly children?: readonly DisplayRow[];
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
  /** The exit contract, without the device id. Empty until the run exits. */
  readonly exitRows: readonly DisplayRow[];
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
  /** Empty when the host has no feature flag: the section is hidden. */
  readonly featureFlagRows: readonly SwitchRow[];
  /** Null when the host does not say whether a mock replaces the flag. */
  readonly featureFlagSource: "flag" | "mock" | null;
  readonly resetFeatureFlag: (() => void) | null;
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

type FirmwareUpdate = Extract<
  OnboardingEvent,
  { type: "FIRMWARE_UPDATE_AVAILABLE" }
>["output"]["firmwareUpdateContext"]["availableUpdate"];

const overrideUpdate = { finalFirmware: { version: "override" } } as FirmwareUpdate;

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
    return { type: "DEVICE_NOT_GENUINE", failure: { isGenuine: false } };
  }
  if (state === "checks.firmwareCheck" && firmware === FirmwareOverride.UpToDate) {
    return { type: "FIRMWARE_UP_TO_DATE", output: overrideFirmware };
  }
  if (state === "checks.firmwareCheck" && firmware === FirmwareOverride.Outdated) {
    return {
      type: "FIRMWARE_UPDATE_AVAILABLE",
      output: {
        ...overrideFirmware,
        firmwareUpdateContext: {
          ...overrideFirmware.firmwareUpdateContext,
          availableUpdate: overrideUpdate,
        },
      },
    };
  }
  return null;
}

function payloadRowsOf(payload: DeviceOnboardingToolPayload | undefined): DisplayRow[] {
  return payload !== null && typeof payload === "object" ? rowsOf(payload) : [];
}

/** One row per field of this level. A level stops at the row limit with "more fields". */
function rowsOf(value: DeviceOnboardingToolPayload & object): DisplayRow[] {
  const entries = Object.entries(value);
  const rows = entries.slice(0, displayedPayloadRows).map(([label, child]) => rowOf(label, child));
  if (entries.length > displayedPayloadRows) {
    rows.push({ label: logCopy.more, value: logCopy.moreFields });
  }
  return rows;
}

function rowOf(label: string, value: DeviceOnboardingToolPayload): DisplayRow {
  if (value === null || typeof value !== "object") return { label, value: formatValue(value) };
  // One row per item makes `mcuVersions` three rows for one fact.
  if (isPlainList(value)) return { label, value: value.map(formatValue).join(", ") };
  return { label, value: `(${Object.keys(value).length})`, children: rowsOf(value) };
}

function isPlainList(
  value: DeviceOnboardingToolPayload & object,
): value is readonly (string | number | boolean | null)[] {
  return Array.isArray(value) && value.every(item => item === null || typeof item !== "object");
}

function featureFlagSourceOf(
  flag: DeviceOnboardingFeatureFlag | undefined,
  isOverridden: boolean | undefined,
): "flag" | "mock" | null {
  if (flag === undefined || isOverridden === undefined) return null;
  return isOverridden ? "mock" : "flag";
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
    machineContext,
    log,
    exit,
    sendableEvents,
    nextStates,
    error,
    featureFlag,
    setFeatureFlag,
    isFeatureFlagOverridden,
    resetFeatureFlag,
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
          { label: "reason", value: formatValue(exit.reason) },
          { label: "sessionId", value: formatValue(exit.sessionId) },
          { label: "modelId", value: formatValue(exit.modelId) },
        ];
  const logLines = logLinesOf(rows);
  const contextRows = payloadRowsOf(machineContext ?? undefined);

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

  const transportWentAwayMidRun = status === "running" && device === null;

  return {
    statusLabel: statusCopy[status],
    exportLogs: () => JSON.stringify({ status, device, state, machineContext, log, exit }, null, 2),
    logLines,
    deviceLabel,
    isRunning: status === "running",
    contextRows,
    exitRows,
    sendableRows,
    nextStateGroups: groupByEvent(nextStates),
    // The host offers events and next states only while the machine runs, so they come with a log.
    logIsEmpty: logLines.length === 0,
    error,
    canConnect:
      status === "idle" ||
      status === "exited" ||
      (status === "connecting" && error !== null) ||
      transportWentAwayMidRun,
    canSend: status === "running" && device !== null,
    canReset: status !== "idle",
    connect: props.connect,
    send,
    reset: props.reset,
    featureFlagRows: featureFlagRows(featureFlag, setFeatureFlag),
    featureFlagSource: featureFlagSourceOf(featureFlag, isFeatureFlagOverridden),
    resetFeatureFlag: resetFeatureFlag ?? null,
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
