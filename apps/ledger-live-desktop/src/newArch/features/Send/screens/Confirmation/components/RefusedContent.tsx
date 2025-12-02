import React from "react";
import { Button, DialogBody, DialogFooter, Spot } from "@ledgerhq/lumen-ui-react";

export function RefusedContent({ onRetry, onClose }: { onRetry: () => void; onClose: () => void }) {
  return (
    <>
      <DialogBody>
        <div className="flex flex-col items-center gap-24 overflow-hidden">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-full" />
          <Spot appearance="info" size={72} />
          <div className="flex flex-col items-center gap-12 text-center">
            <h3 className="heading-3-semi-bold text-base">Transaction Canceled</h3>
            <p className="body-2 text-muted">
              You rejected the transaction. Your funds won’t be affected.
            </p>
          </div>
        </div>
      </DialogBody>
      <DialogFooter className="gap-8">
        <Button appearance="gray" size="lg" isFull onClick={onRetry}>
          Try again
        </Button>
        <Button appearance="base" size="lg" isFull onClick={onClose}>
          Close
        </Button>
      </DialogFooter>
    </>
  );
}
