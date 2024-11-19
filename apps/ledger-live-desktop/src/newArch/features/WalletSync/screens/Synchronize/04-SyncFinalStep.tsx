import React from "react";
import { Success } from "../../components/Success";
import { useTranslation } from "react-i18next";
import {
  AnalyticsPage,
  useLedgerSyncAnalytics,
  AnalyticsFlow,
} from "../../hooks/useLedgerSyncAnalytics";
import { useDispatch } from "react-redux";
import { setDrawerVisibility, setFlow } from "~/renderer/actions/walletSync";
import { Flow, Step } from "~/renderer/reducers/walletSync";

export default function SyncFinalStep() {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const { onClickTrack } = useLedgerSyncAnalytics();

  const title = "walletSync.success.synch.title";
  const desc = "walletSync.success.synch.desc";

  const onClose = () => {
    dispatch(setDrawerVisibility(false));
    onClickTrack({
      button: "Close",
      page: AnalyticsPage.KeyUpdated,
      flow: AnalyticsFlow,
    });
  };

  const goToSync = () => {
    dispatch(setFlow({ flow: Flow.Synchronize, step: Step.SynchronizeWithQRCode }));
    onClickTrack({
      button: "Sync with another Ledger Live",
      page: AnalyticsPage.KeyUpdated,
      flow: AnalyticsFlow,
    });
  };

  return (
    <Success
      title={t(title)}
      description={t(desc)}
      analyticsPage={AnalyticsPage.KeyUpdated}
      withClose
      onClose={onClose}
      withCta
      onClick={goToSync}
    />
  );
}
