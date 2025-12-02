import React from "react";
import { Button, DialogBody, DialogFooter, Spot } from "@ledgerhq/lumen-ui-react";

export function SuccessContent({
  onViewDetails,
  onClose,
}: {
  onViewDetails: () => void;
  onClose: () => void;
}) {
  return (
    <>
      <DialogBody>
        <div className="flex flex-col items-center gap-24 overflow-hidden">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-full bg-gradient-success" />
          <Spot appearance="check" size={72} />
          <div className="flex flex-col items-center gap-12 text-center">
            <h3 className="heading-3-semi-bold text-base">Transaction signed</h3>
            <p className="body-2 text-muted">Your transaction is being processed.</p>
          </div>
        </div>
      </DialogBody>
      <DialogFooter className="gap-8">
        <Button appearance="gray" size="lg" isFull onClick={onViewDetails}>
          View transaction
        </Button>
        <Button appearance="base" size="lg" isFull onClick={onClose}>
          Close
        </Button>
      </DialogFooter>
    </>
  );
}
