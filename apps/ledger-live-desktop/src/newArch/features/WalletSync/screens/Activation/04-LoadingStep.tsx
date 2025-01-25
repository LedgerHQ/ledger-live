import React from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { themeSelector } from "~/renderer/actions/general";
import TrackPage from "~/renderer/analytics/TrackPage";
import Loading from "../../components/LoadingStep";
import { AnalyticsFlow, AnalyticsPage } from "../../hooks/useLedgerSyncAnalytics";
import { useLoadingStep } from "../../hooks/useLoadingStep";

export default function ActivationLoadingStep() {
  useLoadingStep();
  const { t } = useTranslation();
  const currentTheme = useSelector(themeSelector);
  const title = "walletSync.loading.title";

  return (
    <>
      <TrackPage category={String(AnalyticsPage.Loading)} flow={AnalyticsFlow} />
      <Loading
        title={t(title)}
        subtitle={t("walletSync.loading.activation")}
        theme={currentTheme}
      />
    </>
  );
}
