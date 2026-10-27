import React from "react";
import { Skeleton, Subheader, SubheaderRow, SubheaderTitle } from "@ledgerhq/lumen-ui-react";
import { useTranslation } from "react-i18next";
import { ServiceAccountsTable } from "./components/ServiceAccountsTable";
import type { ServiceAccountsViewProps } from "./types";

export function ServiceAccountsView({
  phase,
  error,
  totalLabel,
  skippedCount,
  rows,
  emptyState,
}: ServiceAccountsViewProps) {
  const { t } = useTranslation();

  return (
    <section
      className="flex flex-col gap-12"
      data-testid="portfolio-service-accounts"
      aria-label={t("portfolio.service.title")}
    >
      <Subheader>
        <SubheaderRow>
          <SubheaderTitle>{t("portfolio.service.title")}</SubheaderTitle>
        </SubheaderRow>
      </Subheader>
      <p className="body-2 text-muted">{t("portfolio.service.subtitle")}</p>
      {phase === "loading" ? (
        <Skeleton
          data-testid="portfolio-service-loading"
          className="h-48 w-256 rounded-md"
          aria-label={t("portfolio.service.loading")}
        />
      ) : null}
      {error ? (
        <p className="body-2 text-error" data-testid="portfolio-service-error">
          {error}
        </p>
      ) : null}
      {totalLabel ? (
        <p className="heading-2" data-testid="portfolio-service-total">
          {totalLabel}
        </p>
      ) : null}
      {skippedCount > 0 ? (
        <p className="body-2 text-muted">
          {t("portfolio.service.skipped", { count: skippedCount })}
        </p>
      ) : null}
      {phase === "ready" && rows.length === 0
        ? (emptyState ?? <p className="body-2 text-muted">{t("portfolio.service.empty")}</p>)
        : null}
      {rows.length > 0 ? <ServiceAccountsTable rows={rows} /> : null}
    </section>
  );
}
