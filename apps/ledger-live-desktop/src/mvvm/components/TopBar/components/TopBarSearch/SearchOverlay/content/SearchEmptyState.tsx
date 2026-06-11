import React from "react";
import { useTranslation } from "react-i18next";

type SearchEmptyStateProps = Readonly<{
  query: string;
}>;

export function SearchEmptyState({ query }: SearchEmptyStateProps) {
  const { t } = useTranslation();

  return (
    <span className="body-2 text-muted" data-testid="search-empty-state">
      {t("topBar.search.noResults", { query })}
    </span>
  );
}
