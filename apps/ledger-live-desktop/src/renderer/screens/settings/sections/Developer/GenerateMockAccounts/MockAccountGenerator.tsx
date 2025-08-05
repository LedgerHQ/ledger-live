import React from "react";
import { SettingsSectionRow } from "~/renderer/screens/settings/SettingsSection";
import Button from "~/renderer/components/Button";
import { generateRandomAccounts, injectMockAccounts } from "./utils";

type Props = {
  count: number;
  title: string;
  desc: string;
};

export default function MockAccountGenerator({ count, title, desc }: Props) {
  const handleGenerate = async () => {
    try {
      const accounts = generateRandomAccounts(count);
      await injectMockAccounts(accounts, true);
    } catch (error) {
      console.error("Failed to generate mock accounts:", error);
      alert("Failed to generate mock accounts. Please try again.");
    }
  };

  return (
    <SettingsSectionRow title={title} desc={desc}>
      <Button
        primary
        onClick={() => {
          if (window.confirm("This will erase existing accounts. Continue?")) {
            handleGenerate();
          }
        }}
      >
        Generate {count} Accounts
      </Button>
    </SettingsSectionRow>
  );
}
