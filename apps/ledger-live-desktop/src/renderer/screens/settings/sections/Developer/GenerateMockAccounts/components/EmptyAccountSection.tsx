import React from "react";
import { useTranslation } from "react-i18next";
import { SectionCard } from "./SectionCard";
import type { EmptyAccountSectionProps } from "../types";

export const EmptyAccountSection = ({ enabled, onEnabledChange }: EmptyAccountSectionProps) => {
  const { t } = useTranslation();

  return (
    <SectionCard
      name="empty-account"
      title={t("settings.developer.mockAccounts.empty.title")}
      description={t("settings.developer.mockAccounts.empty.desc")}
      enabled={enabled}
      onEnabledChange={onEnabledChange}
    />
  );
};
