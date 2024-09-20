import React, { useMemo, useRef } from "react";
import Button from "~/renderer/components/Button";
import { SideDrawer } from "~/renderer/components/SideDrawer";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import {
  walletSyncDrawerVisibilitySelector,
  walletSyncFakedSelector,
  walletSyncStepSelector,
} from "~/renderer/reducers/walletSync";
import { resetWalletSync, setDrawerVisibility } from "~/renderer/actions/walletSync";

import {
  useLedgerSyncAnalytics,
  AnalyticsPage,
  AnalyticsFlow,
  StepsOutsideFlow,
} from "LLD/features/WalletSync/hooks/useLedgerSyncAnalytics";
import { BackRef, WalletSyncRouter } from "LLD/features/WalletSync/screens/router";
import { useFlows, STEPS_WITH_BACK } from "LLD/features/WalletSync/hooks/useFlows";

/**
 *
 * STEPS_WITH_BACK is used to determine whether a back button should be displayed in the WalletSyncRow  component,
 * depending on the current step and the current flow.
 *
 * childRef is used to access the return function in child components.
 *
 */

const WalletSyncRow = () => {
  const { goToWelcomeScreenWalletSync } = useFlows();
  const childRef = useRef<BackRef>(null);
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const isOpen = useSelector(walletSyncDrawerVisibilitySelector);

  const currentStep = useSelector(walletSyncStepSelector);
  const hasBeenFaked = useSelector(walletSyncFakedSelector);
  const hasBack = useMemo(() => STEPS_WITH_BACK.includes(currentStep), [currentStep]);

  const hasFlowEvent = useMemo(() => !StepsOutsideFlow.includes(currentStep), [currentStep]);

  const { onClickTrack, onActionTrack } = useLedgerSyncAnalytics();

  const handleBack = () => {
    if (childRef.current && hasBack) {
      childRef.current.goBack();
      onActionTrack({
        button: "Back",
        step: currentStep,
        flow: hasFlowEvent ? AnalyticsFlow : undefined,
      });
    }
  };

  const closeDrawer = () => {
    if (hasBeenFaked) {
      dispatch(resetWalletSync());
    } else {
      onActionTrack({
        button: "Close",
        step: currentStep,
        flow: hasFlowEvent ? AnalyticsFlow : undefined,
      });
    }
    dispatch(setDrawerVisibility(false));
  };

  const openDrawer = () => {
    if (!hasBeenFaked) {
      goToWelcomeScreenWalletSync();
      onClickTrack({ button: "Manage Ledger Sync", page: AnalyticsPage.SettingsGeneral });
    }
    dispatch(setDrawerVisibility(true));
  };

  return (
    <>
      <SideDrawer
        isOpen={isOpen}
        onRequestClose={closeDrawer}
        onRequestBack={hasBack ? handleBack : undefined}
        direction="left"
        forceDisableFocusTrap
      >
        <WalletSyncRouter ref={childRef} />
      </SideDrawer>

      <Button small event="Manage WalletSync" primary onClick={openDrawer}>
        {t("walletSync.manage.cta")}
      </Button>
    </>
  );
};
export default WalletSyncRow;
