import React from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogBody } from "@ledgerhq/lumen-ui-react";
import TrackPage from "~/renderer/analytics/TrackPage";
import { useReceiveOptionsViewModel } from "../../hooks/useReceiveOptionsViewModel";
import { ReceiveOptionsView } from "./ReceiveOptionsView";
import type { ReceiveOptionsDialogProps } from "../../types";

export function ReceiveOptionsDialog({ onClose, onGoToAccount }: ReceiveOptionsDialogProps) {
  const { t } = useTranslation();
  const { handleGoToBank, handleGoToCrypto } = useReceiveOptionsViewModel({
    onClose,
    onGoToAccount,
  });

  return (
    <Dialog open onOpenChange={open => !open && onClose()}>
      <DialogContent>
        <TrackPage category="receive_drawer" type="drawer" />
        <DialogHeader appearance="extended" title={t("receive.title")} onClose={onClose} />
        <DialogBody className="px-16! pt-12">
          <ReceiveOptionsView onGoToBank={handleGoToBank} onGoToCrypto={handleGoToCrypto} />
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
