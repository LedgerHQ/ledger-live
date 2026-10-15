import React from "react";
import { Button, Spot } from "@ledgerhq/lumen-ui-react";
import type { RemoveAccountContentViewProps } from "./types";

export function RemoveAccountContentView({
  labels,
  onConfirm,
  onCancel,
}: RemoveAccountContentViewProps) {
  return (
    <div
      className="flex flex-col items-center gap-32 text-center"
      data-testid="account-settings-remove-content"
    >
      <div className="flex flex-col items-center gap-24">
        <Spot appearance="error" size={72} />
        <div className="flex flex-col gap-8">
          <h2 className="heading-4-semi-bold text-base">{labels.title}</h2>
          <p className="body-2 text-muted">{labels.description}</p>
        </div>
      </div>
      <div className="flex w-full flex-col gap-16">
        <Button
          appearance="base"
          size="lg"
          isFull
          onClick={onConfirm}
          data-testid="account-settings-remove-confirm"
        >
          {labels.confirm}
        </Button>
        <Button
          appearance="gray"
          size="lg"
          isFull
          onClick={onCancel}
          data-testid="account-settings-remove-cancel"
        >
          {labels.cancel}
        </Button>
      </div>
    </div>
  );
}
