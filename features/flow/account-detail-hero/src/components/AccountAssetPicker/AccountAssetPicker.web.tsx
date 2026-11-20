import React from "react";
import { Dialog, DialogBody, DialogContent, DialogHeader } from "@ledgerhq/lumen-ui-react";
import { useTranslation } from "@shared/i18n";
import type { AccountAssetPickerProps } from "./AccountAssetPicker.types";
import { AccountAssetPickerContent } from "./Content/AccountAssetPickerContent";
import { useAccountAssetPickerViewModel } from "./hooks/useAccountAssetPickerViewModel";

export function AccountAssetPicker({
  open,
  rows,
  onSelect,
  onClose,
  testID,
}: AccountAssetPickerProps) {
  const { t } = useTranslation();
  const { rows: shownRows } = useAccountAssetPickerViewModel({ open, rows });

  return (
    <Dialog open={open} onOpenChange={isOpen => !isOpen && onClose()} height="fit">
      <DialogContent data-testid={testID}>
        <DialogHeader
          density="expanded"
          title={t("accountDetailHero.assetPicker.title")}
          onClose={onClose}
        />
        <DialogBody>
          <AccountAssetPickerContent rows={shownRows} onSelect={onSelect} testID={testID} />
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
