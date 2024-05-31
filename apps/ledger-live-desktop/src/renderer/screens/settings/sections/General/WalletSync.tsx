import React, { useMemo, useRef, useState } from "react";
import Button from "~/renderer/components/Button";
import { SideDrawer } from "~/renderer/components/SideDrawer";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import {
  Flow,
  walletSyncFlowSelector,
  walletSyncStepSelector,
} from "~/renderer/reducers/walletSync";
import { setFlow, setStep } from "~/renderer/actions/walletSync";
import { BackRef, STEPS_WITH_BACK, WalletSyncRouter } from "LLD/WalletSync/Flows/router";

/**
 *
 * STEPS_WITH_BACK is used to determine whether a back button should be displayed in the WalletSyncRow  component,
 * depending on the current step and the current flow.
 *
 * childRef is used to access the return function in child components.
 *
 */

const WalletSyncRow = () => {
  const childRef = useRef<BackRef>(null);
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const currentStep = useSelector(walletSyncStepSelector);
  const currentFlow = useSelector(walletSyncFlowSelector);

  const hasBack = useMemo(
    () => STEPS_WITH_BACK[currentFlow].includes(currentStep),
    [currentFlow, currentStep],
  );

  const handleBack = () => {
    if (childRef.current) {
      childRef.current.goBack();
    }
  };

  const closeDrawer = () => {
    setOpen(false);
    resetFlow();
  };
  const resetFlow = () => {
    dispatch(setFlow(Flow.Activation));
    dispatch(setStep(1));
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

      <Button small event="Manage WalletSync" primary onClick={() => setOpen(true)}>
        {t("walletSync.manage.cta")}
      </Button>
    </>
  );
};
export default WalletSyncRow;
