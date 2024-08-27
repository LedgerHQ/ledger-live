import React from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { setDrawerVisibility, setFlow } from "~/renderer/actions/walletSync";
import { Flow, Step } from "~/renderer/reducers/walletSync";
import { AnalyticsPage, useWalletSyncAnalytics } from "../../hooks/useWalletSyncAnalytics";
import { Info } from "../../components/Info";

export default function AlreadyCreatedWithSameSeedStep() {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const { onClickTrack } = useWalletSyncAnalytics();

  const understood = () => {
    dispatch(setFlow({ flow: Flow.WalletSyncActivated, step: Step.WalletSyncActivated }));
    onClickTrack({
      button: "I Understand",
      page: AnalyticsPage.AlreadySecuredSameSeed,
      flow: "Wallet Sync",
    });
  };

  const onClose = () => {
    dispatch(setDrawerVisibility(false));
    onClickTrack({
      button: "Close",
      page: AnalyticsPage.AlreadySecuredSameSeed,
      flow: "Wallet Sync",
    });
  };
  return (
    <Info
      title={t("walletSync.alredySecureError.title")}
      description={t("walletSync.alredySecureError.description")}
      withCta
      onClick={understood}
      onClose={onClose}
      analyticsPage={AnalyticsPage.AlreadySecuredSameSeed}
      specificCta={t("walletSync.alredySecureError.cta")}
    />
  );
}
