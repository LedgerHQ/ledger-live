import React, { useId } from "react";
import { Button, Checkbox, DialogFooter } from "@ledgerhq/lumen-ui-react";
import type { AcknowledgementViewProps } from "./Acknowledgement.types";

export function AcknowledgementView({
  acknowledgement,
  cta,
  disclaimer,
  onConfirm,
  hasAcknowledged,
  onAcknowledgedChange,
}: AcknowledgementViewProps) {
  const checkboxId = useId();

  return (
    <DialogFooter>
      <div className="flex flex-1 flex-col gap-24">
        <div className="flex items-start gap-8">
          <Checkbox
            id={checkboxId}
            checked={hasAcknowledged}
            onCheckedChange={onAcknowledgedChange}
          />
          <label className="flex-1 cursor-pointer body-3 text-base" htmlFor={checkboxId}>
            {acknowledgement}
          </label>
        </div>
        <Button appearance="base" size="lg" isFull disabled={!hasAcknowledged} onClick={onConfirm}>
          {cta}
        </Button>
        {disclaimer ? <p className="text-center body-4 text-muted">{disclaimer}</p> : null}
      </div>
    </DialogFooter>
  );
}
