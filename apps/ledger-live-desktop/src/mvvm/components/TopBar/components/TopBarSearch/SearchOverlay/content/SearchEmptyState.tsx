import React from "react";
import { useTranslation } from "react-i18next";
import { Spot } from "@ledgerhq/lumen-ui-react";
import { Search } from "@ledgerhq/lumen-ui-react/symbols";

export function SearchEmptyState() {
  const { t } = useTranslation();

  return (
    <div
      className="flex flex-col items-center justify-center gap-16 py-40"
      data-testid="search-empty-state"
    >
      <Spot appearance="icon" icon={Search} />
      <span className="heading-4-semi-bold text-base">{t("topBar.search.noAssetFound")}</span>
    </div>
  );
}
