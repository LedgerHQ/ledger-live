import type { DeviceActionModelId } from "./types";

export const supportedDeviceActionModelIds: readonly DeviceActionModelId[] = [
  "nanoS",
  "nanoSP",
  "nanoX",
  "stax",
  "europa",
  "apex",
];

const supported: ReadonlySet<string> = new Set(supportedDeviceActionModelIds);

/**
 * Narrows a raw device model id (e.g. from the `DeviceModelId` enum) to `DeviceActionModelId`.
 * Returns null for `blue` and for any model id this package doesn't have an animation for.
 */
export function toDeviceActionModelId(modelId: string): DeviceActionModelId | null {
  return supported.has(modelId) ? (modelId as DeviceActionModelId) : null;
}
