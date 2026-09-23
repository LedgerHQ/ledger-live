import React, { type ReactNode } from "react";
import { DialogBody } from "@ledgerhq/lumen-ui-react";

type SponsoredRentSignatureScreenViewProps = Readonly<{
  strategyLabel: string;
  feeLabel: string;
  /** null while the order hasn't been crafted yet — the fee summary has nothing to show. */
  feeAmountLabel: string | null;
  children: ReactNode;
}>;

export function SponsoredRentSignatureScreenView({
  strategyLabel,
  feeLabel,
  feeAmountLabel,
  children,
}: SponsoredRentSignatureScreenViewProps) {
  return (
    <DialogBody className="gap-8 -mt-12 pt-2" data-testid="send-sponsored-rent-signature">
      {feeAmountLabel ? (
        <div className="flex flex-col gap-4">
          <p className="m-0 body-3 text-muted">{strategyLabel}</p>
          <div className="flex items-center justify-between">
            <span className="body-2">{feeLabel}</span>
            <span className="body-2">{feeAmountLabel}</span>
          </div>
        </div>
      ) : null}
      {children}
    </DialogBody>
  );
}
