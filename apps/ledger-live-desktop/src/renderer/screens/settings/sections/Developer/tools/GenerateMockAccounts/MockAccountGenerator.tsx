import React from "react";
import { useTranslation } from "react-i18next";
import { SettingsSectionRow } from "~/renderer/screens/settings/SettingsSection";
import { Button } from "@ledgerhq/lumen-ui-react";
import { generateRandomAccounts, injectMockAccounts } from "./utils";

type Props = {
  count: number;
  title: string;
  desc: string;
};

export default function MockAccountGenerator({ count, title, desc }: Props) {
  const { t } = useTranslation();

  const handleGenerate = async () => {
    try {
      const accounts = generateRandomAccounts(count);
      await injectMockAccounts(accounts, true);
    } catch (error) {
      console.error("Failed to generate mock accounts:", error);
      alert(t("settings.developer.mockAccounts.alerts.generateError"));
    }
  };

  return (
    <SettingsSectionRow title={title} desc={desc}>
      <Button
        appearance="accent"
        size="sm"
        onClick={() => {
          if (window.confirm(t("settings.developer.mockAccounts.alerts.confirmErase"))) {
            handleGenerate();
          }
        }}
      >
        {t("settings.developer.mockAccounts.buttons.generateAccountsQuick", {
          count,
        })}
      </Button>
    </SettingsSectionRow>
  );
}
