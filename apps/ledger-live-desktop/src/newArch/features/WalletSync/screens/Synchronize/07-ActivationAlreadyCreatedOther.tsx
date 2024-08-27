import React from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { setDrawerVisibility, setFlow } from "~/renderer/actions/walletSync";
import { Flow, Step } from "~/renderer/reducers/walletSync";
import { AnalyticsPage, useWalletSyncAnalytics } from "../../hooks/useWalletSyncAnalytics";
import { Error } from "../../components/Error";

export default function AlreadyCreatedOtherSeedStep() {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const { onClickTrack } = useWalletSyncAnalytics();

  const deleteKey = () => {
    dispatch(setFlow({ flow: Flow.ManageBackup, step: Step.ManageBackup }));
    onClickTrack({
      button: "Delete my encryption key",
      page: AnalyticsPage.AlreadySecuredOtherSeed,
      flow: "Wallet Sync",
    });
  };

  const onClose = () => {
    dispatch(setDrawerVisibility(false));
    onClickTrack({
      button: "close",
      page: AnalyticsPage.AlreadySecuredOtherSeed,
      flow: "Wallet Sync",
    });
  };

  return (
    <Error
      title={t("walletSync.alredySecureOtherSeedError.title")}
      description={t("walletSync.alredySecureOtherSeedError.description")}
      onClick={deleteKey}
      analyticsPage={AnalyticsPage.AlreadySecuredOtherSeed}
      cta={t("walletSync.alredySecureOtherSeedError.cta")}
      ctaVariant="shade"
      onClose={onClose}
    />
  );
}
