import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { SettingsSectionRow } from "~/renderer/screens/settings/SettingsSection";
import { Button } from "@ledgerhq/lumen-ui-react";
import { generateStablecoinAccounts, injectMockAccounts, STABLECOIN_PRESET } from "./utils";

type Props = {
  title: string;
  desc: string;
};

export default function StablecoinMockAccountGenerator({ title, desc }: Props) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const handleGenerate = useCallback(async () => {
    if (!window.confirm(t("settings.developer.mockAccounts.alerts.confirmErase"))) return;
    setLoading(true);
    try {
      const accounts = await generateStablecoinAccounts();
      await injectMockAccounts(accounts, true);
    } catch (error) {
      console.error("Failed to generate stablecoin accounts:", error);
      alert(t("settings.developer.mockAccounts.alerts.generateError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  return (
    <SettingsSectionRow title={title} desc={desc}>
      <Button appearance="accent" size="sm" disabled={loading} onClick={handleGenerate}>
        {t("settings.developer.mockAccounts.buttons.generateStablecoinAccounts", {
          count: STABLECOIN_PRESET.length,
        })}
      </Button>
    </SettingsSectionRow>
  );
}
