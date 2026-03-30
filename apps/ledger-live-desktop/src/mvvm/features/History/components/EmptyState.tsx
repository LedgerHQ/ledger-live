import React from "react";

import { Spot } from "@ledgerhq/lumen-ui-react";
import { useTranslation } from "react-i18next";

export function EmptyState() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center min-h-0 flex-1">
      <Spot appearance="info" />
      <span className="heading-4-semi-bold text-base mt-24 mb-8">
        {t("history.emptyState.title")}
      </span>
      <span className="body-2 text-muted">{t("history.emptyState.description")}</span>
    </div>
  );
}
