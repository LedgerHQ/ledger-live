export const DEVICE_LABEL_I18N_KEYS = {
  nanoS: "settings.debug.deviceSimulationDevTool.devices.nanoS",
  nanoSP: "settings.debug.deviceSimulationDevTool.devices.nanoSP",
  nanoX: "settings.debug.deviceSimulationDevTool.devices.nanoX",
  stax: "settings.debug.deviceSimulationDevTool.devices.stax",
  europa: "settings.debug.deviceSimulationDevTool.devices.europa",
  apex: "settings.debug.deviceSimulationDevTool.devices.apex",
} as const;

export type DeviceLabelKey = keyof typeof DEVICE_LABEL_I18N_KEYS;

export function formatCurrentHistoryDisplay(
  t: (key: string, options?: Record<string, string>) => string,
  currentHistoryLabels: DeviceLabelKey[],
): string {
  return currentHistoryLabels.length > 0
    ? currentHistoryLabels.map(labelKey => t(DEVICE_LABEL_I18N_KEYS[labelKey])).join(", ")
    : t("settings.debug.deviceSimulationDevTool.none");
}
