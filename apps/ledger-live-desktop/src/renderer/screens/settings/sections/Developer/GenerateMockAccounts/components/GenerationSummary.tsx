import React from "react";
import { useTranslation } from "react-i18next";
import type { GenerationSummaryProps } from "../types";
import { Banner } from "@ledgerhq/lumen-ui-react";

export const GenerationSummary = ({ lines, canGenerate }: GenerationSummaryProps) => {
  const { t } = useTranslation();

  if (!canGenerate) {
    return <Banner title={t("settings.developer.mockAccounts.summary.empty")} />;
  }

  return (
    <div className="flex flex-col gap-3 rounded-md bg-surface p-6">
      <span className="body-2-semi-bold">{t("settings.developer.mockAccounts.summary.title")}</span>
      <div className="flex flex-col gap-1">
        {lines.map(line => (
          <div key={line} className="body-3 flex items-baseline gap-2 text-muted">
            <span>•</span>
            <span>{line}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
