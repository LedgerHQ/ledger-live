import React, { useMemo, useRef } from "react";
import { SideDrawer } from "~/renderer/components/SideDrawer";
import { useDispatch, useSelector } from "react-redux";
import {
  walletSyncDrawerVisibilitySelector,
  walletSyncStepSelector,
} from "~/renderer/reducers/walletSync";
import { setDrawerVisibility } from "~/renderer/actions/walletSync";
import {
  useLedgerSyncAnalytics,
  AnalyticsFlow,
  StepsOutsideFlow,
  AnalyticsPage,
} from "LLD/features/WalletSync/hooks/useLedgerSyncAnalytics";
import { BackRef, WalletSyncRouter } from "LLD/features/WalletSync/screens/router";
import { STEPS_WITH_BACK } from "LLD/features/WalletSync/hooks/useFlows";

/**
 *
 * STEPS_WITH_BACK is used to determine whether a back button should be displayed in the WalletSyncRow  component,
 * depending on the current step and the current flow.
 *
 * childRef is used to access the return function in child components.
 *
 */

interface WalletSyncDrawerProps {
  currentPage: AnalyticsPage;
  onClose: () => void;
  onBack?: () => void;
}

const WalletSyncDrawer: React.FC<WalletSyncDrawerProps> = ({ currentPage, onClose, onBack }) => {
  const childRef = useRef<BackRef>(null);
  const dispatch = useDispatch();

  const isOpen = useSelector(walletSyncDrawerVisibilitySelector);
  const currentStep = useSelector(walletSyncStepSelector);
  const hasBack = useMemo(() => STEPS_WITH_BACK.includes(currentStep), [currentStep]);
  const hasFlowEvent = useMemo(() => !StepsOutsideFlow.includes(currentStep), [currentStep]);

  const { onActionTrack } = useLedgerSyncAnalytics();

  const handleBack = () => {
    if (childRef.current && hasBack) {
      childRef.current.goBack();
      onActionTrack({
        button: "Back",
        step: currentStep,
        flow: hasFlowEvent ? AnalyticsFlow : undefined,
      });
      if (onBack) onBack();
    }
  };

  const closeDrawer = () => {
    onActionTrack({
      button: "Close",
      step: currentStep,
      flow: hasFlowEvent ? AnalyticsFlow : undefined,
    });
    dispatch(setDrawerVisibility(false));
    onClose();
  };

  return (
    <SideDrawer
      isOpen={isOpen}
      onRequestClose={closeDrawer}
      onRequestBack={hasBack ? handleBack : undefined}
      direction="left"
      forceDisableFocusTrap
    >
      <WalletSyncRouter currentPage={currentPage} ref={childRef} />
    </SideDrawer>
  );
};

export default WalletSyncDrawer;
