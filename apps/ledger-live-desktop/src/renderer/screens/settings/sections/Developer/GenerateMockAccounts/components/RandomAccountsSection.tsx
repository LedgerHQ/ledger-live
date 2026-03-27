import React from "react";
import { useTranslation } from "react-i18next";
import { TextInput } from "@ledgerhq/lumen-ui-react";
import { SectionCard } from "./SectionCard";
import type { RandomAccountsSectionProps } from "../types";

export const RandomAccountsSection = ({
  enabled,
  count,
  onEnabledChange,
  onCountChange,
}: RandomAccountsSectionProps) => {
  const { t } = useTranslation();

  return (
    <SectionCard
      name="random-accounts"
      title={t("settings.developer.mockAccounts.random.title")}
      description={t("settings.developer.mockAccounts.random.desc")}
      enabled={enabled}
      onEnabledChange={onEnabledChange}
    >
      <div className="w-[160px] mt-4">
        <TextInput
          type="number"
          label={t("settings.developer.mockAccounts.random.countLabel")}
          value={String(count)}
          onChange={e => {
            const raw = e.target.value;
            if (raw === "") {
              onCountChange(0);
              return;
            }
            const val = Number.parseInt(raw, 10);
            if (!Number.isNaN(val) && val >= 0) onCountChange(Math.min(val, 150));
          }}
          min={0}
          max={150}
        />
      </div>
    </SectionCard>
  );
};
