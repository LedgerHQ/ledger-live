import React from "react";
import { Success } from "../../components/Success";
import { useTranslation } from "react-i18next";
import { FinalStepProps } from "./04-DeletionFinalErrorStep";
import {
  AnalyticsFlow,
  AnalyticsPage,
  useLedgerSyncAnalytics,
} from "../../hooks/useLedgerSyncAnalytics";
import { setDrawerVisibility } from "~/renderer/actions/walletSync";
import { useDispatch } from "react-redux";

export default function DeletionFinalStep({ instance }: FinalStepProps) {
  const { t } = useTranslation();
  const title = "walletSync.manageInstances.deleteInstanceSuccess";
  const { onClickTrack } = useLedgerSyncAnalytics();

  const dispatch = useDispatch();

  const onClose = () => {
    dispatch(setDrawerVisibility(false));
    onClickTrack({
      button: "Close",
      page: AnalyticsPage.InstanceRemovalSuccess,
      flow: AnalyticsFlow,
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
