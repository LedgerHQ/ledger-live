import React from "react";
import Loading from "../../components/LoadingStep";
import { useTranslation } from "react-i18next";
import { AnalyticsPage } from "../../hooks/useWalletSyncAnalytics";
import TrackPage from "~/renderer/analytics/TrackPage";
import { useLoadingStep } from "../../hooks/useLoadingStep";
import { walletSyncHasTrustchainBeenCreatedSelector } from "~/renderer/reducers/walletSync";
import { useSelector } from "react-redux";

export default function ActivationLoadingStep() {
  useLoadingStep();
  const hasTrustchainBeenCreated = useSelector(walletSyncHasTrustchainBeenCreatedSelector);
  console.log("Has trustchain been created", hasTrustchainBeenCreated);
  const { t } = useTranslation();
  const title = "walletSync.loading.title";
  const subtitle = hasTrustchainBeenCreated
    ? "walletSync.loading.activation"
    : "walletSync.loading.synch";

  return (
    <>
      <TrackPage category={String(AnalyticsPage.Loading)} />
      <Loading title={t(title)} subtitle={t(subtitle)} />
    </>
  );
}
