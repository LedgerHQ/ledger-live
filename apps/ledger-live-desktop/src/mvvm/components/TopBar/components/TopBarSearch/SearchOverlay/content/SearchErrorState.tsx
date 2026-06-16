import React from "react";
import { useTranslation } from "react-i18next";
import { Spot } from "@ledgerhq/lumen-ui-react";

export function SearchErrorState() {
  const { t } = useTranslation();

  return (
    <div
      className="flex flex-col items-center justify-center gap-16 py-40"
      data-testid="search-error-state"
    >
      <Spot appearance="error" />
      <span className="heading-4-semi-bold text-base">{t("topBar.search.error")}</span>
    </div>
  );
}
