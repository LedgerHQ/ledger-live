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
    <>
      <Spot appearance="error" size={72} />
      <div className="flex flex-col items-center gap-12 text-center">
        <h3 className="text-base heading-3-semi-bold">
          <TranslatedError error={error} field="title" />
        </h3>
        <p className="text-muted body-2">
          <TranslatedError error={error} field="description" />
        </p>
        <button type="button" onClick={handleExportLogs} className="mt-4 text-interactive body-2">
          {t("settings.exportLogs.title")}
        </button>
      </div>
    </>
  );
};
