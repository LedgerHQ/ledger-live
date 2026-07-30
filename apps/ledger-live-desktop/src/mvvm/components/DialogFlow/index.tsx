import React, { useCallback, useEffect, useRef } from "react";
import { Dialog, DialogBody, DialogContent, DialogHeader } from "@ledgerhq/lumen-ui-react";
import type { DialogFlowOptions, DialogFlowProps } from "./types";

export function DialogFlow<Step extends string>({
  currentStep,
  defaultOptions,
  isOpen,
  onBack,
  onClose,
  screens,
}: DialogFlowProps<Step>) {
  const currentScreen = screens[currentStep];
  const options: DialogFlowOptions = {
    ...defaultOptions,
    ...currentScreen.options,
  };
  const hasBackButton = Boolean(onBack) && options.hasBackButton;
  const closeRequestedRef = useRef(false);
  useEffect(() => {
    if (isOpen) {
      closeRequestedRef.current = false;
    }
  }, [isOpen]);
  const handleClose = useCallback(() => {
    if (closeRequestedRef.current) {
      return;
    }

    closeRequestedRef.current = true;
    onClose();
  }, [onClose]);
  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        handleClose();
      }
    },
    [handleClose],
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent {...options.dialogContentProps}>
        <DialogHeader
          {...options.dialogHeaderProps}
          onBack={hasBackButton ? onBack : undefined}
          onClose={handleClose}
        />
        <DialogBody {...options.dialogBodyProps}>{currentScreen.content}</DialogBody>
      </DialogContent>
    </Dialog>
  );
}

export type {
  DialogFlowOptions,
  DialogFlowProps,
  DialogFlowScreen,
  DialogFlowScreenRegistry,
} from "./types";
