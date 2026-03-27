import React from "react";
import { useTranslation } from "react-i18next";
import { TextInput } from "@ledgerhq/lumen-ui-react";
import { SectionCard } from "./SectionCard";
import CurrencySelector from "../CurrencySelector";
import type { ManualAccountsSectionProps } from "../types";

export const ManualAccountsSection = ({
  enabled,
  selectedCurrencies,
  selectedCount,
  tokenIds,
  onEnabledChange,
  onCurrencyToggle,
  onTokenIdsChange,
}: ManualAccountsSectionProps) => {
  const { t } = useTranslation();

  return (
    <SectionCard
      name="manual-accounts"
      title={t("settings.developer.mockAccounts.manual.title")}
      description={t("settings.developer.mockAccounts.manual.desc")}
      enabled={enabled}
      onEnabledChange={onEnabledChange}
    >
      <div className="flex flex-col gap-8 mt-4">
        <CurrencySelector
          selectedCurrencies={selectedCurrencies}
          selectedCount={selectedCount}
          onCurrencyToggle={onCurrencyToggle}
          placeholder={t("settings.developer.mockAccounts.currencySelector.placeholder")}
        />
        <TextInput
          label={t("settings.developer.mockAccounts.tokenIds.label")}
          value={tokenIds}
          onChange={e => onTokenIdsChange(e.target.value)}
        />
      </div>
    </SectionCard>
  );
};
