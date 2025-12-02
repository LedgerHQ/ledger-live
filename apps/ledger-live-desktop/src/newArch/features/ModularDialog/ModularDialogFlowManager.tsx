import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ModularDrawerFlowManagerProps } from "./types";
import {
  resetModularDrawerState,
  modularDrawerFlowSelector,
  modularDialogIsOpenSelector,
  closeDialog,
} from "~/renderer/reducers/modularDrawer";
import { Dialog, DialogContent } from "@ledgerhq/lumen-ui-react";
import { track } from "~/renderer/analytics/segment";
import { currentRouteNameRef } from "~/renderer/analytics/screenRefs";
import { ModularDialogContent } from "./ModularDialogContent";
import { useModularDialogFlow } from "./hooks/useModularDialogFlow";

const ModularDialogFlowManager = ({
  currencies,
  drawerConfiguration,
  useCase,
  areCurrenciesFiltered,
  onAssetSelected,
  onAccountSelected,
  onClose,
}: ModularDrawerFlowManagerProps) => {
  const dispatch = useDispatch();
  const flow = useSelector(modularDrawerFlowSelector);
  const isOpen = useSelector(modularDialogIsOpenSelector);

  const { currentStep, navigationDirection, handleBack, renderStepContent } = useModularDialogFlow({
    currencies,
    drawerConfiguration,
    useCase,
    areCurrenciesFiltered,
    onAssetSelected,
    onAccountSelected,
  });

  const handleClose = () => {
    track("button_clicked", {
      button: "Close",
      flow,
      page: currentRouteNameRef.current,
    });
    dispatch(closeDialog());
    onClose?.();
  };

  useEffect(() => {
    return () => {
      dispatch(resetModularDrawerState());
    };
  }, [dispatch]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="pb-0">
        <ModularDialogContent
          currentStep={currentStep}
          navigationDirection={navigationDirection}
          handleClose={handleClose}
          handleBack={handleBack}
          renderStepContent={renderStepContent}
        />
      </DialogContent>
    </Dialog>
  );
};

export default ModularDialogFlowManager;
