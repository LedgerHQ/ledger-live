import React from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectItemText,
  SelectList,
  SelectTrigger,
  Switch,
} from "@ledgerhq/lumen-ui-react";
import Box from "~/renderer/components/Box";
import Input from "~/renderer/components/Input";
import Track from "~/renderer/analytics/Track";
import { SettingsSectionRow as Row } from "../../../SettingsSection";
import { useMockServerDeviceSettingsViewModel } from "./useMockServerDeviceSettingsViewModel";

const MockServerDeviceSettings = () => {
  const { t } = useTranslation();
  const {
    visible,
    model,
    onboarded,
    osVersion,
    osVersionDraft,
    osVersionApplied,
    modelOptions,
    pending,
    failed,
    onModelChange,
    onOnboardedChange,
    onOsVersionDraftChange,
    onOsVersionApply,
  } = useMockServerDeviceSettingsViewModel();

  if (!visible) return null;

  const modelDesc = failed
    ? t("settings.developer.mockServerDevice.error")
    : t("settings.developer.mockServerDevice.modelDesc");

  return (
    <>
      <Row
        title={t("settings.developer.mockServerDevice.model")}
        desc={modelDesc}
        dataTestId="settings-mock-server-device-model"
      >
        <Track onUpdate event="MockServerDeviceModel" model={model} />
        <Select
          value={model}
          items={modelOptions}
          disabled={pending}
          onValueChange={value => {
            if (value == null) return;
            onModelChange(value);
          }}
        >
          <SelectTrigger label={t("settings.developer.mockServerDevice.model")} />
          <SelectContent>
            <SelectList
              renderItem={item => (
                <SelectItem key={item.value} value={item.value}>
                  <SelectItemText>{item.label}</SelectItemText>
                </SelectItem>
              )}
            />
          </SelectContent>
        </Select>
      </Row>
      <Row
        title={t("settings.developer.mockServerDevice.osVersion")}
        desc={t("settings.developer.mockServerDevice.osVersionDesc")}
        dataTestId="settings-mock-server-device-os-version"
      >
        <Track onUpdate event="MockServerDeviceOsVersion" osVersion={osVersion} />
        <Box grow horizontal flow={2} alignItems="center">
          <Input
            small
            style={{ minWidth: 120, maxWidth: 200, width: "100%" }}
            value={osVersionDraft}
            onChange={onOsVersionDraftChange}
            onEnter={onOsVersionApply}
            data-testid="settings-mock-server-device-os-version-input"
          />
          <Button
            size="sm"
            appearance="accent"
            disabled={pending || osVersionApplied || !osVersionDraft.trim()}
            onClick={onOsVersionApply}
            data-testid="settings-mock-server-device-os-version-button"
          >
            {t("common.apply")}
          </Button>
        </Box>
      </Row>
      <Row
        title={t("settings.developer.mockServerDevice.onboarded")}
        desc={t("settings.developer.mockServerDevice.onboardedDesc")}
      >
        <Track onUpdate event="MockServerDeviceOnboarded" onboarded={onboarded} />
        <Switch
          selected={onboarded}
          disabled={pending}
          onChange={onOnboardedChange}
          data-testid="settings-mock-server-device-onboarded"
        />
      </Row>
    </>
  );
};

export default MockServerDeviceSettings;
