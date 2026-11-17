import React from "react";
import { useTranslation } from "react-i18next";
import { Switch } from "@ledgerhq/lumen-ui-react";
import { SettingsSectionRow } from "~/renderer/screens/settings/SettingsSection";

type HideNightlyLayerRowViewProps = {
  readonly isHidden: boolean;
  readonly onChange: (checked: boolean) => void;
};

export function HideNightlyLayerRowView({ isHidden, onChange }: HideNightlyLayerRowViewProps) {
  const { t } = useTranslation();

  return (
    <SettingsSectionRow
      title={t("settings.developer.hideNightlyLayer.title")}
      desc={t("settings.developer.hideNightlyLayer.desc")}
    >
      <Switch selected={isHidden} onChange={onChange} data-testid="settings-hide-nightly-layer" />
    </SettingsSectionRow>
  );
}
