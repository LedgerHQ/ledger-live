import React, { useMemo } from "react";
import WalletSyncDrawer from "LLD/features/WalletSync/components/Drawer";
import { useDispatch, useSelector } from "react-redux";
import { resetWalletSync, setDrawerVisibility } from "~/renderer/actions/walletSync";
import { walletSyncFakedSelector, walletSyncStepSelector } from "~/renderer/reducers/walletSync";
import { useTranslation } from "react-i18next";
import Button from "~/renderer/components/Button";
import { useFlows } from "LLD/features/WalletSync/hooks/useFlows";
import {
  useLedgerSyncAnalytics,
  AnalyticsPage,
  StepsOutsideFlow,
  AnalyticsFlow,
} from "LLD/features/WalletSync/hooks/useLedgerSyncAnalytics";

const WalletSyncRow = () => {
  const { goToWelcomeScreenWalletSync } = useFlows();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const hasBeenFaked = useSelector(walletSyncFakedSelector);
  const { onClickTrack, onActionTrack } = useLedgerSyncAnalytics();
  const currentStep = useSelector(walletSyncStepSelector);
  const hasFlowEvent = useMemo(() => !StepsOutsideFlow.includes(currentStep), [currentStep]);

  const openDrawer = () => {
    if (!hasBeenFaked) {
      goToWelcomeScreenWalletSync();
      onClickTrack({ button: "Manage Ledger Sync", page: AnalyticsPage.SettingsGeneral });
    }
    dispatch(setDrawerVisibility(true));
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

  return (
    <>
      <WalletSyncDrawer currentPage={AnalyticsPage.SettingsGeneral} onClose={closeDrawer} />
      <Button small event="Manage WalletSync" primary onClick={openDrawer}>
        {t("walletSync.manage.cta")}
      </Button>
    </>
  );
};

export default WalletSyncRow;
