import React, { type ReactNode } from "react";
import { DialogBody } from "@ledgerhq/lumen-ui-react";

type SponsoredPollingScreenViewProps = Readonly<{
  elapsedLabel: string;
  children: ReactNode;
}>;

export function SponsoredPollingScreenView({
  elapsedLabel,
  children,
}: SponsoredPollingScreenViewProps) {
  return (
    <DialogBody className="gap-8 -mt-12 pt-2" data-testid="send-sponsored-polling">
      {children}
      <p className="m-0 body-3 text-muted text-center">{elapsedLabel}</p>
    </DialogBody>
  );
}
