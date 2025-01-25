import React from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { setDrawerVisibility, setFlow } from "~/renderer/actions/walletSync";
import { Flow, Step } from "~/renderer/reducers/walletSync";
import { AnalyticsPage, useLedgerSyncAnalytics } from "../../hooks/useLedgerSyncAnalytics";
import { Info } from "../../components/Info";

export default function AlreadyCreatedWithSameSeedStep() {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const { onClickTrack } = useLedgerSyncAnalytics();

  const understood = () => {
    dispatch(setFlow({ flow: Flow.LedgerSyncActivated, step: Step.LedgerSyncActivated }));
    onClickTrack({
      button: "I Understand",
      page: AnalyticsPage.AlreadySecuredSameSeed,
    });
  };

  const onClose = () => {
    dispatch(setDrawerVisibility(false));
    onClickTrack({
      button: "Close",
      page: AnalyticsPage.AlreadySecuredSameSeed,
    });
  };
  return (
    <Info
      title={t("walletSync.alreadySecureError.title")}
      description={t("walletSync.alreadySecureError.description")}
      withCta
      onClick={understood}
      onClose={onClose}
      analyticsPage={AnalyticsPage.AlreadySecuredSameSeed}
      specificCta={t("walletSync.alreadySecureError.cta")}
    />
  );
}
