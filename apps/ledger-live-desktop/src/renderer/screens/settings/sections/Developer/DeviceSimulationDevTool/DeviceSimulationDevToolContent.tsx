import React from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@ledgerhq/lumen-ui-react";
import { DeveloperToggleRow } from "../components/DeveloperToggleRow";
import type { DeviceSimulationDevToolViewModel } from "./useDeviceSimulationDevToolViewModel";

const DEVICE_LABEL_I18N_KEYS = {
  nanoS: "settings.developer.deviceSimulationDevTool.devices.nanoS",
  nanoSP: "settings.developer.deviceSimulationDevTool.devices.nanoSP",
  nanoX: "settings.developer.deviceSimulationDevTool.devices.nanoX",
  stax: "settings.developer.deviceSimulationDevTool.devices.stax",
  europa: "settings.developer.deviceSimulationDevTool.devices.europa",
  apex: "settings.developer.deviceSimulationDevTool.devices.apex",
} as const;

type Props = Readonly<
  DeviceSimulationDevToolViewModel & {
    expanded: boolean;
  }
>;

export function DeviceSimulationDevToolContent({
  expanded,
  deviceModels,
  currentHistoryLabels,
  isResetEnabled,
  isDeviceSeen,
  toggleDevice,
  resetDevices,
}: Props) {
  const { t } = useTranslation();

  const currentHistoryDisplay =
    currentHistoryLabels.length > 0
      ? currentHistoryLabels.map(labelKey => t(DEVICE_LABEL_I18N_KEYS[labelKey])).join(", ")
      : t("settings.developer.deviceSimulationDevTool.none");

  return (
    <div className="flex flex-col gap-2 pt-2">
      <p className="text-muted">{t("settings.developer.deviceSimulationDevTool.description")}</p>
      <p className="body-3 text-muted" data-testid="device-simulation-current-history">
        {t("settings.developer.deviceSimulationDevTool.currentHistory", {
          devices: currentHistoryDisplay,
        })}
      </p>

      {expanded ? (
        <div className="mt-4 flex flex-col gap-6">
          <p className="body-3 text-muted">
            {t("settings.developer.deviceSimulationDevTool.resetWarning")}
          </p>

          <div className="flex flex-col gap-4">
            {deviceModels.map(model => (
              <DeveloperToggleRow
                key={model.id}
                name={`device-simulation-${model.id}`}
                label={t(DEVICE_LABEL_I18N_KEYS[model.labelKey])}
                selected={isDeviceSeen(model.id)}
                onChange={() => toggleDevice(model.id, !isDeviceSeen(model.id))}
              />
            ))}
          </div>

          <div className="flex">
            <Button
              appearance="accent"
              size="sm"
              onClick={resetDevices}
              disabled={!isResetEnabled}
              data-testid="device-simulation-reset"
            >
              {t("settings.developer.deviceSimulationDevTool.reset")}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
