import React, { useMemo, useRef, useState } from "react";
import Button from "~/renderer/components/Button";
import { SideDrawer } from "~/renderer/components/SideDrawer";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { walletSyncFakedSelector, walletSyncStepSelector } from "~/renderer/reducers/walletSync";
import { resetWalletSync } from "~/renderer/actions/walletSync";
import { trustchainSelector } from "@ledgerhq/trustchain/store";
import {
  useWalletSyncAnalytics,
  AnalyticsPage,
} from "LLD/features/WalletSync/hooks/useWalletSyncAnalytics";
import { BackRef, WalletSyncRouter } from "LLD/features/WalletSync/screens/router";
import { useFlows, STEPS_WITH_BACK } from "~/newArch/features/WalletSync/hooks/useFlows";

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
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const currentStep = useSelector(walletSyncStepSelector);
  const hasBeenFaked = useSelector(walletSyncFakedSelector);
  const hasBack = useMemo(() => STEPS_WITH_BACK.includes(currentStep), [currentStep]);
  const trustchain = useSelector(trustchainSelector);

  const { onClickTrack, onActionTrack } = useWalletSyncAnalytics();

  const handleBack = () => {
    if (childRef.current && hasBack) {
      childRef.current.goBack();
      onActionTrack({ button: "Back", step: currentStep, flow: "Wallet Sync" });
    }
  };

  const closeDrawer = () => {
    if (hasBeenFaked) {
      dispatch(resetWalletSync());
    } else {
      onActionTrack({ button: "Close", step: currentStep, flow: "Wallet Sync" });
    }
    setOpen(false);
  };

  const openDrawer = () => {
    if (!hasBeenFaked) {
      goToWelcomeScreenWalletSync(!!trustchain?.rootId);
      onClickTrack({ button: "Wallet Sync", page: AnalyticsPage.SettingsGeneral });
    }
    setOpen(true);
  };

  return (
    <>
      <SideDrawer
        isOpen={open}
        onRequestClose={closeDrawer}
        onRequestBack={hasBack ? handleBack : undefined}
        direction="left"
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
