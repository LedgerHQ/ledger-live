import React from "react";
import { useTranslation } from "react-i18next";
import { Spot } from "@ledgerhq/lumen-ui-react";
import TranslatedError from "~/renderer/components/TranslatedError";
import { useExportLogs } from "LLD/hooks/useExportLogs";

type ErrorContentProps = Readonly<{
  error?: Error | null;
}>;

export const ErrorContent = ({ error }: ErrorContentProps) => {
  const { t } = useTranslation();
  const { handleExportLogs } = useExportLogs();

  if (!error) {
    return null;
  }

  return (
    <div
      className="flex flex-col items-center gap-24 -mt-12"
      data-testid="send-confirmation-error-content"
    >
      <Spot appearance="error" size={72} />
      <div className="flex flex-col items-center gap-12 text-center">
        <h3 className="heading-3-semi-bold text-base" data-testid="send-confirmation-error-title">
          <TranslatedError error={error} field="title" />
        </h3>
        <p className="body-2 text-muted">
          <TranslatedError error={error} field="description" />
        </p>
        <button
          type="button"
          onClick={handleExportLogs}
          className="mt-4 body-2 text-interactive"
          data-testid="send-confirmation-export-logs-button"
        >
          {t("settings.exportLogs.title")}
        </button>
      </div>
    </div>
  );
};
