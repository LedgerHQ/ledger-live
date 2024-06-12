import React, { useMemo, useRef, useState } from "react";
import Button from "~/renderer/components/Button";
import { SideDrawer } from "~/renderer/components/SideDrawer";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { walletSyncFakedSelector, walletSyncStepSelector } from "~/renderer/reducers/walletSync";
import { resetWalletSync } from "~/renderer/actions/walletSync";
import { BackRef, WalletSyncRouter } from "LLD/WalletSync/Flows/router";
import { STEPS_WITH_BACK, useFlows } from "LLD/WalletSync/Flows/useFlows";

/**
 *
 * STEPS_WITH_BACK is used to determine whether a back button should be displayed in the WalletSyncRow  component,
 * depending on the current step and the current flow.
 *
 * childRef is used to access the return function in child components.
 *
 */

const WalletSyncRow = () => {
  const { goToWelcomeScreenWalletSync } = useFlows({});
  const childRef = useRef<BackRef>(null);
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const currentStep = useSelector(walletSyncStepSelector);
  const hasBeenFaked = useSelector(walletSyncFakedSelector);
  const hasBack = useMemo(() => STEPS_WITH_BACK.includes(currentStep), [currentStep]);

  const handleBack = () => {
    if (childRef.current) {
      childRef.current.goBack();
    }
  };

  const closeDrawer = () => {
    resetFlow();
    setOpen(false);
  };

  const openDrawer = () => {
    if (!hasBeenFaked) {
      goToWelcomeScreenWalletSync();
    }
    setOpen(true);
  };

  const resetFlow = () => {
    dispatch(resetWalletSync());
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
