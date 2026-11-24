import React, { useCallback } from "react";
import { Dialog, DialogBody, DialogContent, DialogHeader } from "@ledgerhq/lumen-ui-react";
import type { SettingsSheetProps } from "./SettingsSheet.types";

export function SettingsSheet({
  isOpen,
  title,
  description,
  onClose,
  children,
  testID,
}: SettingsSheetProps) {
  const onOpenChange = useCallback(
    (open: boolean) => {
      if (!open) onClose();
    },
    [onClose],
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-[400px] bg-canvas-sheet" data-testid={testID}>
        <DialogHeader title={title} description={description} onClose={onClose} />
        <DialogBody className="flex flex-col gap-24 px-24 pb-24">{children}</DialogBody>
      </DialogContent>
    </Dialog>
  );
}
