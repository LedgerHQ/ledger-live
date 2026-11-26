import React, { useCallback } from "react";
import { Dialog, DialogBody, DialogContent, DialogHeader } from "@ledgerhq/lumen-ui-react";
import type { SettingsSheetProps } from "./SettingsSheet.types";

export function SettingsSheet({
  isOpen,
  title,
  description,
  headerDensity = "compact",
  onClose,
  canClose = true,
  children,
  testID,
}: SettingsSheetProps) {
  const onOpenChange = useCallback(
    (open: boolean) => {
      if (!open && canClose) onClose();
    },
    [onClose, canClose],
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-[400px] bg-canvas-sheet" data-testid={testID}>
        <DialogHeader
          density={headerDensity}
          title={title}
          description={description}
          onClose={canClose ? onClose : undefined}
        />
        <DialogBody className="flex flex-col gap-24 px-24 pb-24">{children}</DialogBody>
      </DialogContent>
    </Dialog>
  );
}
