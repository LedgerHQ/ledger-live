import React from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@ledgerhq/lumen-ui-react";
import { useMockAccountGeneratorViewModel } from "./hooks/useMockAccountGeneratorViewModel";
import {
  RandomAccountsSection,
  EmptyAccountSection,
  StablecoinsSection,
  ManualAccountsSection,
  GenerationSummary,
} from "./components";
import type { MockAccountGeneratorContentProps } from "./types";

export const MockAccountGeneratorContent = ({ expanded }: MockAccountGeneratorContentProps) => {
  const { t } = useTranslation();
  const vm = useMockAccountGeneratorViewModel();

  return (
    <div className="flex flex-col gap-2 pt-2">
      <p className="text-muted">{t("settings.developer.mockAccounts.description")}</p>

      {expanded && (
        <div className="mt-6 flex flex-col gap-8">
          <RandomAccountsSection
            enabled={vm.randomEnabled}
            count={vm.randomCount}
            onEnabledChange={vm.setRandomEnabled}
            onCountChange={vm.setRandomCount}
          />

          <EmptyAccountSection enabled={vm.emptyEnabled} onEnabledChange={vm.setEmptyEnabled} />

          <StablecoinsSection
            enabled={vm.stablecoinsEnabled}
            onEnabledChange={vm.setStablecoinsEnabled}
          />

          <ManualAccountsSection
            enabled={vm.manualEnabled}
            selectedCurrencies={vm.selectedCurrencies}
            selectedCount={vm.selectedCount}
            tokenIds={vm.tokenIds}
            onEnabledChange={vm.setManualEnabled}
            onCurrencyToggle={vm.handleCurrencyToggle}
            onTokenIdsChange={vm.setTokenIds}
          />

          <GenerationSummary lines={vm.summaryLines} canGenerate={vm.canGenerate} />

          <div className="flex justify-end">
            <Button
              appearance="accent"
              size="sm"
              disabled={!vm.canGenerate}
              onClick={vm.handleGenerate}
            >
              {t("settings.developer.mockAccounts.buttons.generate")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
