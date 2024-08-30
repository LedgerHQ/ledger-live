import React from "react";
import { Error } from "../../components/Error";
import { useTranslation } from "react-i18next";
import { AnalyticsPage } from "../../hooks/useLedgerSyncAnalytics";
import { useDispatch } from "react-redux";
import { setFlow } from "~/renderer/actions/walletSync";
import { Flow, Step } from "~/renderer/reducers/walletSync";

export default function UnbackedError() {
  const { t } = useTranslation();

  const dispatch = useDispatch();

  return (
    <Error
      title={t("walletSync.synchronize.unbackedError.title")}
      description={t("walletSync.synchronize.unbackedError.description")}
      analyticsPage={AnalyticsPage.UnbackedError}
      cta={t("walletSync.synchronize.unbackedError.cta")}
      onClick={() => dispatch(setFlow({ flow: Flow.Activation, step: Step.DeviceAction }))}
      ctaVariant="main"
    />
  );
}
