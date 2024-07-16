import React from "react";
import { Success } from "../../components/Success";
import { useTranslation } from "react-i18next";
import { AnalyticsPage } from "../../hooks/useWalletSyncAnalytics";

export default function SyncFinalStep() {
  const { t } = useTranslation();
  const title = "walletSync.success.synch.title";
  const desc = "walletSync.success.synch.desc";
  return (
    <Success title={t(title)} description={t(desc)} analyticsPage={AnalyticsPage.KeyUpdated} />
  );
}
