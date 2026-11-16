import React, { useMemo, useRef, useState } from "react";
import type { TrustchainMember } from "@ledgerhq/ledger-key-ring-protocol/types";
import { SideDrawer } from "~/renderer/components/SideDrawer";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { walletSyncDrawerVisibilitySelector } from "~/renderer/reducers/walletSync";
import { setDrawerVisibility } from "~/renderer/actions/walletSync";
import {
  useLedgerSyncAnalytics,
  AnalyticsFlow,
  StepsOutsideFlow,
  AnalyticsPage,
  resolveWalletSyncEntryFlow,
} from "LLD/features/WalletSync/hooks/useLedgerSyncAnalytics";
import { BackRef, WalletSyncRouter } from "LLD/features/WalletSync/screens/router";
import { STEPS_WITH_BACK } from "LLD/features/WalletSync/hooks/useFlows";
import { useTheme } from "styled-components";
import { LedgerSyncDeviceStep } from "LLD/features/WalletSync/deviceIntents/LedgerSyncDeviceStep";
import { LedgerSyncDeviceStepErrorContext } from "LLD/features/WalletSync/deviceIntents/LedgerSyncDeviceStepError";
import { useLedgerSyncDeviceStep } from "LLD/features/WalletSync/deviceIntents/useLedgerSyncDeviceStep";

/**
 *
 * STEPS_WITH_BACK is used to determine whether a back button should be displayed in the WalletSyncRow  component,
 * depending on the current step and the current flow.
 *
 * childRef is used to access the return function in child components.
 *
 * With the `lwdLedgerSyncDie` flag, the device step runs on DIE outside the panel, which stays
 * closed meanwhile so that only the device dialog shows.
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
  const { colors } = useTheme();

  const isOpen = useSelector(walletSyncDrawerVisibilitySelector);
  const deviceStep = useLedgerSyncDeviceStep(isOpen);
  const currentStep = deviceStep.step;
  const [selectedInstance, setSelectedInstance] = useState<TrustchainMember | null>(null);
  const hasBack = useMemo(() => STEPS_WITH_BACK.includes(currentStep), [currentStep]);
  const hasFlowEvent = useMemo(() => !StepsOutsideFlow.includes(currentStep), [currentStep]);

  const { onActionTrack } = useLedgerSyncAnalytics();

  const handleBack = () => {
    if (childRef.current && hasBack) {
      childRef.current.goBack();
      onActionTrack({
        button: "Back",
        step: currentStep,
        flow: hasFlowEvent ? resolveWalletSyncEntryFlow(AnalyticsFlow) : undefined,
      });
      if (onBack) onBack();
    }
  };

  const closeDrawer = () => {
    onActionTrack({
      button: "Close",
      step: currentStep,
      flow: hasFlowEvent ? resolveWalletSyncEntryFlow(AnalyticsFlow) : undefined,
    });
    dispatch(setDrawerVisibility(false));
    onClose();
  };

  return (
    <>
      <SideDrawer
        isOpen={isOpen && !deviceStep.runsOnDevice}
        onRequestClose={closeDrawer}
        onRequestBack={hasBack ? handleBack : undefined}
        direction="left"
        forceDisableFocusTrap
        style={{
          background: colors.background.card,
        }}
      >
        <LedgerSyncDeviceStepErrorContext.Provider value={deviceStep.errorContext}>
          <WalletSyncRouter
            currentPage={currentPage}
            ref={childRef}
            selectedInstance={selectedInstance}
            onSelectInstance={setSelectedInstance}
          />
        </LedgerSyncDeviceStepErrorContext.Provider>
      </SideDrawer>
      {deviceStep.runsOnDevice && (
        <LedgerSyncDeviceStep
          step={currentStep}
          sourcePage={currentPage}
          member={selectedInstance}
          onError={deviceStep.onError}
        />
      )}
    </>
  );
};

export default WalletSyncDrawer;
