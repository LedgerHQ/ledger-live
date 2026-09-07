import React from "react";
import { useTranslation } from "~/context/Locale";
import { Flex, Text, Switch } from "@ledgerhq/native-ui";
import { Button as LumenButton } from "@ledgerhq/lumen-ui-rnative";
import SettingsRow from "~/components/SettingsRow";
import { DEVICE_LABEL_I18N_KEYS, formatCurrentHistoryDisplay } from "./deviceSimulationLabels";
import { useDeviceSimulationDevToolViewModel } from "./useDeviceSimulationDevToolViewModel";

const DeviceSimulationDevToolContent = () => {
  const { t } = useTranslation();
  const {
    deviceModels,
    currentHistoryLabels,
    isResetEnabled,
    isDeviceSeen,
    toggleDevice,
    resetDevices,
  } = useDeviceSimulationDevToolViewModel();

  const currentHistoryDisplay = formatCurrentHistoryDisplay(t, currentHistoryLabels);

  return (
    <>
      <Flex px={6} pb={4} pt={2}>
        <Text variant="bodyLineHeight" color="neutral.c70" mb={4}>
          {t("settings.debug.deviceSimulationDevTool.description")}
        </Text>
        <Text
          variant="bodyLineHeight"
          color="neutral.c70"
          mb={4}
          testID="device-simulation-current-history"
        >
          {t("settings.debug.deviceSimulationDevTool.currentHistory", {
            devices: currentHistoryDisplay,
          })}
        </Text>
        <Text variant="bodyLineHeight" color="neutral.c70">
          {t("settings.debug.deviceSimulationDevTool.resetWarning")}
        </Text>
      </Flex>
      {deviceModels.map(model => (
        <SettingsRow
          key={model.id}
          title={t(DEVICE_LABEL_I18N_KEYS[model.labelKey])}
          desc={t("settings.debug.deviceSimulationDevTool.deviceDesc")}
        >
          <Switch
            checked={isDeviceSeen(model.id)}
            onChange={enabled => toggleDevice(model.id, enabled)}
          />
        </SettingsRow>
      ))}
      <Flex px={6} py={4}>
        <LumenButton
          appearance="accent"
          size="md"
          onPress={resetDevices}
          disabled={!isResetEnabled}
          testID="device-simulation-reset"
        >
          {t("settings.debug.deviceSimulationDevTool.reset")}
        </LumenButton>
      </Flex>
    </>
  );
};

export default DeviceSimulationDevToolContent;
