import React from "react";
import { Dialog, DialogBody, DialogContent, DialogHeader } from "@ledgerhq/lumen-ui-react";
import { RequestReceiveSummary } from "./RequestReceiveSummary.web";
import { RequestReceiveActions } from "./RequestReceiveActions.web";
import { useRequestReceiveView } from "./useRequestReceiveView.web";
import type { RequestReceiveViewProps } from "../../types";

export function RequestReceiveView({
  isOpen,
  labels,
  assetIcon,
  networkIcon,
  visibleActions,
  addressParts,
  qrPayload,
  onClose,
  onShare,
  onCopy,
  onSave,
  onVerify,
}: RequestReceiveViewProps) {
  const { hasCopied, handleOpenChange, handleCopy } = useRequestReceiveView({
    isOpen,
    onClose,
    onCopy,
  });

  if (!isOpen) {
    return null;
  }

  return (
    <Dialog open onOpenChange={handleOpenChange} height="fit">
      <DialogContent className="max-h-[90vh]">
        <DialogHeader onClose={onClose} />
        <DialogBody className="flex flex-col gap-12" data-testid="pay-request-receive">
          <RequestReceiveSummary
            title={labels.title}
            networkLabel={labels.networkLabel}
            assetIcon={assetIcon}
            networkIcon={networkIcon}
            addressParts={addressParts}
            qrPayload={qrPayload}
          />
          <RequestReceiveActions
            labels={labels.actions}
            visibleActions={visibleActions}
            hasCopied={hasCopied}
            onShare={onShare}
            onCopy={handleCopy}
            onSave={onSave}
            onVerify={onVerify}
          />
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
