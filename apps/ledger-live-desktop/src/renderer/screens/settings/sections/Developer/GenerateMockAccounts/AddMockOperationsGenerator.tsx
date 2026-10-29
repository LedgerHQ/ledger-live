import React from "react";
import { useTranslation } from "react-i18next";
import { SettingsSectionRow } from "~/renderer/screens/settings/SettingsSection";
import { Button } from "@ledgerhq/lumen-ui-react";
import { addMockOperationsToAllAccounts } from "./utils";

type Props = {
  title: string;
  desc: string;
  count: number;
};

export default function AddMockOperationsGenerator({ title, desc, count }: Props) {
  const { t } = useTranslation();

  const handleAdd = async () => {
    try {
      await addMockOperationsToAllAccounts(count);
    } catch (error) {
      console.warn("Failed to add mock operations:", error);
      alert(t("settings.developer.mockAccounts.alerts.generateError"));
    }
  };

  return (
    <SettingsSectionRow title={title} desc={desc}>
      <Button appearance="accent" size="sm" onClick={handleAdd}>
        {t("settings.developer.mockAccounts.buttons.addMockOperations", { count })}
      </Button>
    </SettingsSectionRow>
  );
}
