import React from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { setDrawerVisibility, setFlow } from "~/renderer/actions/walletSync";
import { Flow, Step } from "~/renderer/reducers/walletSync";
import { AnalyticsPage, useLedgerSyncAnalytics } from "../../hooks/useLedgerSyncAnalytics";
import { Error } from "../../components/Error";

export default function AlreadyCreatedOtherSeedStep() {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const { onClickTrack } = useLedgerSyncAnalytics();

  const deleteKey = () => {
    dispatch(setFlow({ flow: Flow.ManageBackup, step: Step.DeleteBackup }));
    onClickTrack({
      button: "Delete sync",
      page: AnalyticsPage.AlreadySecuredOtherSeed,
    });
  };

  const onClose = () => {
    dispatch(setDrawerVisibility(false));
    onClickTrack({
      button: "close",
      page: AnalyticsPage.AlreadySecuredOtherSeed,
    });
  };

  return (
    <Error
      title={t("walletSync.alreadySecureOtherSeedError.title")}
      description={t("walletSync.alreadySecureOtherSeedError.description")}
      onClick={deleteKey}
      analyticsPage={AnalyticsPage.AlreadySecuredOtherSeed}
      cta={t("walletSync.alreadySecureOtherSeedError.cta")}
      ctaVariant="shade"
      onClose={onClose}
    />
  );
}
