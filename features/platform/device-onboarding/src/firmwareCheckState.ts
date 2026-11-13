import type { FirmwareCheck } from "./types";

type SettledFirmware = Extract<
  FirmwareCheck,
  { kind: "upToDate" | "declined" | "skipped" | "deferred" }
>;

const settledFirmwareKinds = new Set<FirmwareCheck["kind"]>([
  "upToDate",
  "declined",
  "skipped",
  "deferred",
]);

export function firmwareSettled(firmware: FirmwareCheck | null): firmware is SettledFirmware {
  return firmware !== null && settledFirmwareKinds.has(firmware.kind);
}
