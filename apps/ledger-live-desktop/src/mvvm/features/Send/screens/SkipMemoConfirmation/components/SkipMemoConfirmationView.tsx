import React from "react";
import { Button, Checkbox, DialogBody, DialogFooter, Link } from "@ledgerhq/lumen-ui-react";

type SkipMemoConfirmationViewProps = Readonly<{
  description: string;
  learnMoreLabel: string;
  doNotAskAgain: boolean;
  doNotAskAgainLabel: string;
  confirmLabel: string;
  cancelLabel: string;
  onDoNotAskAgainChange: (checked: boolean) => void;
  onConfirm: () => void;
  onCancel: () => void;
  onLearnMore: () => void;
}>;

export function SkipMemoConfirmationView({
  description,
  learnMoreLabel,
  doNotAskAgain,
  doNotAskAgainLabel,
  confirmLabel,
  cancelLabel,
  onDoNotAskAgainChange,
  onConfirm,
  onCancel,
  onLearnMore,
}: SkipMemoConfirmationViewProps) {
  return (
    <>
      <DialogBody className="flex flex-col gap-16 pt-0">
        <p className="body-2 text-muted">
          {description}{" "}
          <Link appearance="accent" size="sm" onClick={onLearnMore}>
            {learnMoreLabel}
          </Link>
        </p>
        <div
          className="flex items-center gap-8 self-start"
          data-testid="send-skip-memo-never-ask-again"
        >
          <Checkbox
            id="send-skip-memo-never-ask-again-checkbox"
            checked={doNotAskAgain}
            onCheckedChange={onDoNotAskAgainChange}
          />
          <label
            className="body-3 cursor-pointer text-base"
            htmlFor="send-skip-memo-never-ask-again-checkbox"
          >
            {doNotAskAgainLabel}
          </label>
        </div>
      </DialogBody>
      <DialogFooter className="flex flex-col gap-12">
        <Button
          appearance="base"
          size="lg"
          isFull
          data-testid="send-skip-memo-confirm"
          onClick={onConfirm}
        >
          {confirmLabel}
        </Button>
        <Button
          appearance="gray"
          size="lg"
          isFull
          data-testid="send-skip-memo-cancel"
          onClick={onCancel}
        >
          {cancelLabel}
        </Button>
      </DialogFooter>
    </>
  );
}
