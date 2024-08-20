import React from "react";
import { Success } from "../../components/Success";
import { useTranslation } from "react-i18next";
import { FinalStepProps } from "./04-DeletionFinalErrorStep";
import { AnalyticsPage, useWalletSyncAnalytics } from "../../hooks/useWalletSyncAnalytics";
import { setDrawerVisibility } from "~/renderer/actions/walletSync";
import { useDispatch } from "react-redux";

export default function DeletionFinalStep({ instance }: FinalStepProps) {
  const { t } = useTranslation();
  const title = "walletSync.manageInstances.deleteInstanceSuccess";
  const { onClickTrack } = useWalletSyncAnalytics();

  const dispatch = useDispatch();

  const onClose = () => {
    dispatch(setDrawerVisibility(false));
    onClickTrack({
      button: "Close",
      page: AnalyticsPage.InstanceRemovalSuccess,
      flow: "Wallet Sync",
    });
  };
  return (
    <Success
      title={t(title, {
        instanceName: instance?.name,
      })}
      analyticsPage={AnalyticsPage.InstanceRemovalSuccess}
      withClose
      onClose={onClose}
    />
  );
}
