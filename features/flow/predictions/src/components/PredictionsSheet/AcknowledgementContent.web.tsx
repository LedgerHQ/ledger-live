import React, { useState, type ReactNode } from "react";
import { Button, Checkbox, DialogBody, DialogFooter } from "@ledgerhq/lumen-ui-react";

type AcknowledgementContentProps = Readonly<{
  id: string;
  children: ReactNode;
  acknowledgement: string;
  cta: string;
  disclaimer?: string;
  onConfirm: () => void;
}>;

export function AcknowledgementContent({
  id,
  children,
  acknowledgement,
  cta,
  disclaimer,
  onConfirm,
}: AcknowledgementContentProps) {
  const [hasAcknowledged, setHasAcknowledged] = useState(false);

  return (
    <>
      <DialogBody>{children}</DialogBody>
      <DialogFooter className="flex-col gap-24">
        <div className="flex items-start gap-8">
          <Checkbox id={id} checked={hasAcknowledged} onCheckedChange={setHasAcknowledged} />
          <label className="flex-1 cursor-pointer body-3 text-base" htmlFor={id}>
            {acknowledgement}
          </label>
        </div>
        <Button appearance="base" size="lg" isFull disabled={!hasAcknowledged} onClick={onConfirm}>
          {cta}
        </Button>
        {disclaimer ? <p className="text-center body-4 text-muted">{disclaimer}</p> : null}
      </DialogFooter>
    </>
  );
}
