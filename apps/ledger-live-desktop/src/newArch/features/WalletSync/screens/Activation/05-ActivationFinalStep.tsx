import React, { useEffect } from "react";
import { Success } from "../../components/Success";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { setDrawerVisibility, setFlow } from "~/renderer/actions/walletSync";
import { Flow, Step } from "~/renderer/reducers/walletSync";
import {
  AnalyticsPage,
  useLedgerSyncAnalytics,
  AnalyticsFlow,
} from "../../hooks/useLedgerSyncAnalytics";
import { useCompleteActionCallback } from "~/renderer/components/PostOnboardingHub/logic/useCompleteAction";
import { PostOnboardingActionId } from "@ledgerhq/types-live";

type Props = {
  isNewBackup: boolean;
};

export default function ActivationFinalStep({ isNewBackup }: Props) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const completeAction = useCompleteActionCallback();
  const title = isNewBackup ? "walletSync.success.backup.title" : "walletSync.success.synch.title";
  const desc = isNewBackup ? "" : "walletSync.success.synch.desc";

  const { onClickTrack } = useLedgerSyncAnalytics();

  const goToSync = () => {
    dispatch(setFlow({ flow: Flow.Synchronize, step: Step.SynchronizeWithQRCode }));
    onClickTrack({
      button: "Sync with another Ledger Live",
      page: isNewBackup ? AnalyticsPage.KeyCreated : AnalyticsPage.KeyUpdated,
      flow: AnalyticsFlow,
    });
  };

  const onClose = () => {
    dispatch(setDrawerVisibility(false));
    onClickTrack({
      button: "Close",
      page: isNewBackup ? AnalyticsPage.KeyCreated : AnalyticsPage.KeyUpdated,
      flow: AnalyticsFlow,
    });
  };

  useEffect(() => {
    completeAction(PostOnboardingActionId.syncAccounts);
  }, [completeAction]);

  return (
    <Success
      title={t(title)}
      description={t(desc)}
      withCta
      withClose
      onClick={goToSync}
      onClose={onClose}
      analyticsPage={isNewBackup ? AnalyticsPage.KeyCreated : AnalyticsPage.KeyUpdated}
    />
  );
}
