import type { QA_DEVICE_MODELS } from "./qaDeviceModels";

export type DeviceLabelKey = (typeof QA_DEVICE_MODELS)[number]["labelKey"];

export function formatCurrentHistoryDisplay(
  t: (key: string, options?: Record<string, string>) => string,
  currentHistoryLabels: DeviceLabelKey[],
): string {
  return currentHistoryLabels.length > 0
    ? currentHistoryLabels
        .map(labelKey => t(`settings.debug.deviceSimulationDevTool.devices.${labelKey}`))
        .join(", ")
    : t("settings.debug.deviceSimulationDevTool.none");
}
