import React from "react";
import { Button, DialogBody, DialogFooter } from "@ledgerhq/lumen-ui-react";

type SponsoredFailureScreenViewProps = Readonly<{
  /** null renders no message (defensive; the screen is only reached with a set failureKind). */
  message: string | null;
  retryLabel: string;
  cancelLabel: string;
  onRetry: () => void;
  onCancel: () => void;
}>;

export function SponsoredFailureScreenView({
  message,
  retryLabel,
  cancelLabel,
  onRetry,
  onCancel,
}: SponsoredFailureScreenViewProps) {
  return (
    <>
      <DialogBody className="gap-8 -mt-12 pt-2" data-testid="send-sponsored-failure">
        {message ? <p className="m-0 body-2 text-muted text-center">{message}</p> : null}
      </DialogBody>
      <DialogFooter className="flex flex-col gap-12">
        <Button
          appearance="base"
          size="lg"
          isFull
          data-testid="send-sponsored-failure-retry"
          onClick={onRetry}
        >
          {retryLabel}
        </Button>
        <Button
          appearance="gray"
          size="lg"
          isFull
          data-testid="send-sponsored-failure-cancel"
          onClick={onCancel}
        >
          {cancelLabel}
        </Button>
      </DialogFooter>
    </>
  );
}
