import React from "react";
import { Button, DialogBody, DialogFooter, Spot } from "@ledgerhq/lumen-ui-react";
import { useExportLogs } from "LLD/hooks/useExportLogs";

export function ErrorContent({
  onRetry,
  onClose,
  message,
}: {
  onRetry: () => void;
  onClose: () => void;
  message?: string;
}) {
  const { handleExportLogs } = useExportLogs();

  return (
    <>
      <DialogBody>
        <div className="flex flex-col items-center gap-24 overflow-hidden">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-full bg-gradient-error" />
          <Spot appearance="error" size={72} />
          <div className="flex flex-col items-center gap-12 text-center">
            <h3 className="heading-3-semi-bold text-base">Transaction error</h3>
            <p className="body-2 text-muted">
              {message || "An error occurred while signing the transaction."}{" "}
            </p>
            <button
              type="button"
              onClick={handleExportLogs}
              className="mt-4"
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 600,
                fontSize: "14px",
                color: "#8b5eb9ff",
              }}
            >
              Save logs
            </button>
          </div>
        </div>
      </DialogBody>
      <DialogFooter className="gap-8">
        <Button appearance="gray" size="lg" isFull onClick={onClose}>
          Close
        </Button>
        <Button appearance="base" size="lg" isFull onClick={onRetry}>
          Try again
        </Button>
      </DialogFooter>
    </>
  );
}
