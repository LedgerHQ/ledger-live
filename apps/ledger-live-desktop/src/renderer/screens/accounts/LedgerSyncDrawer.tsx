import React, { useMemo } from "react";
import WalletSyncDrawer from "LLD/features/WalletSync/components/Drawer";
import { useDispatch, useSelector } from "react-redux";
import { setDrawerVisibility } from "~/renderer/actions/walletSync";
import {
  useLedgerSyncAnalytics,
  AnalyticsPage,
  AnalyticsFlow,
  StepsOutsideFlow,
} from "LLD/features/WalletSync/hooks/useLedgerSyncAnalytics";
import { walletSyncStepSelector } from "~/renderer/reducers/walletSync";

const WalletSyncRow = () => {
  const dispatch = useDispatch();
  const { onActionTrack } = useLedgerSyncAnalytics();
  const currentStep = useSelector(walletSyncStepSelector);
  const hasFlowEvent = useMemo(() => !StepsOutsideFlow.includes(currentStep), [currentStep]);

  const closeDrawer = () => {
    onActionTrack({
      button: "Close",
      step: currentStep,
      flow: hasFlowEvent ? AnalyticsFlow : undefined,
    });
    dispatch(setDrawerVisibility(false));
  };

  return <WalletSyncDrawer currentPage={AnalyticsPage.LedgerSyncAccounts} onClose={closeDrawer} />;
};

export default WalletSyncRow;
