import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { SettingsSectionRow as Row } from "../../../SettingsSection";
import { Button } from "@ledgerhq/lumen-ui-react";
import { DeviceSimulationDevToolContent } from "./DeviceSimulationDevToolContent";
import { useDeviceSimulationDevToolViewModel } from "./useDeviceSimulationDevToolViewModel";

const DeviceSimulationDevTool = () => {
  const { t } = useTranslation();
  const [contentExpanded, setContentExpanded] = useState(false);
  const viewModel = useDeviceSimulationDevToolViewModel();

  const toggleContentVisibility = useCallback(() => {
    setContentExpanded(prev => !prev);
  }, []);

  return (
    <Row
      title={t("settings.developer.deviceSimulationDevTool.title")}
      dataTestId="device-simulation-dev-tool"
      descContainerStyle={{ maxWidth: undefined }}
      contentContainerStyle={{ marginRight: 0 }}
      childrenContainerStyle={{ alignSelf: "flex-start" }}
      desc={<DeviceSimulationDevToolContent expanded={contentExpanded} {...viewModel} />}
    >
      <Button appearance="accent" size="sm" onClick={toggleContentVisibility}>
        {contentExpanded ? t("settings.developer.hide") : t("settings.developer.show")}
      </Button>
    </Row>
  );
};

export default DeviceSimulationDevTool;
