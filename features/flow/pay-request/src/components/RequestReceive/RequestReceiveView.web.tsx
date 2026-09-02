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
  verifyHint,
}: RequestReceiveViewProps) {
  const { hasCopied, hint, handleOpenChange, handleCopy, handleInteractOutside } =
    useRequestReceiveView({
      isOpen,
      onClose,
      onCopy,
      verifyHint,
    });

  if (!isOpen) {
    return null;
  }

  return (
    <Dialog open onOpenChange={handleOpenChange} height="fit">
      <DialogContent
        className="max-h-[90vh]"
        onPointerDownOutside={handleInteractOutside}
        onInteractOutside={handleInteractOutside}
      >
        {hint?.open ? (
          <div
            aria-hidden
            data-testid="pay-request-receive-verify-hint-overlay"
            className="absolute inset-0 z-table-header bg-canvas-overlay"
          />
        ) : null}
        <DialogHeader onClose={() => handleOpenChange(false)} />
        <DialogBody
          className="relative flex flex-col gap-12 overflow-visible"
          data-testid="pay-request-receive"
        >
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
            verifyHint={hint}
          />
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
