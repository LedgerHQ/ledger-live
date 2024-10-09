import React from "react";
import Loading from "../../components/LoadingStep";
import { useTranslation } from "react-i18next";
import { AnalyticsFlow, AnalyticsPage } from "../../hooks/useLedgerSyncAnalytics";
import TrackPage from "~/renderer/analytics/TrackPage";
import { useLoadingStep } from "../../hooks/useLoadingStep";

export default function ActivationLoadingStep() {
  useLoadingStep();
  const { t } = useTranslation();
  const title = "walletSync.loading.title";

  return (
    <>
      <TrackPage category={String(AnalyticsPage.Loading)} flow={AnalyticsFlow} />
      <Loading title={t(title)} subtitle={t("walletSync.loading.activation")} />
    </>
  );
}
