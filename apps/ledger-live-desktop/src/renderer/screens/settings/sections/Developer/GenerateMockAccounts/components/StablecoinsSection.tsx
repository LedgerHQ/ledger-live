import React from "react";
import { useTranslation } from "react-i18next";
import { SectionCard } from "./SectionCard";
import { CURRENCIES_WITH_STABLECOINS, getStablecoinTokensForCurrency } from "../utils";
import type { StablecoinsSectionProps } from "../types";

export const StablecoinsSection = ({ enabled, onEnabledChange }: StablecoinsSectionProps) => {
  const { t } = useTranslation();

  const chainSummary = CURRENCIES_WITH_STABLECOINS.map(id => {
    const tokens = getStablecoinTokensForCurrency(id);
    return `${id.charAt(0).toUpperCase() + id.slice(1)} (${tokens.map(tk => tk.ticker).join(", ")})`;
  }).join(" · ");

  return (
    <SectionCard
      name="stablecoins"
      title={t("settings.developer.mockAccounts.stablecoins.title")}
      description={t("settings.developer.mockAccounts.stablecoins.desc")}
      enabled={enabled}
      onEnabledChange={onEnabledChange}
    >
      <div className="rounded-md bg-surface p-3">
        <span className="body-3 text-muted">{chainSummary}</span>
      </div>
    </SectionCard>
  );
};
