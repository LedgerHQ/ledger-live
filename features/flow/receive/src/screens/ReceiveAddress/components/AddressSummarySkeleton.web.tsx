import React from "react";
import { Skeleton } from "@ledgerhq/lumen-ui-react";

// The final box of the QR card and the address: the 256px card, then two lines of text.
const QR_CARD_SIZE = 256;
const LINE_HEIGHT = 20;

export function AddressSummarySkeleton() {
  return (
    <div className="flex flex-col items-center gap-16" data-testid="receive-address-skeleton">
      <Skeleton className="rounded-2xl" style={{ width: QR_CARD_SIZE, height: QR_CARD_SIZE }} />
      <div className="flex flex-col items-center gap-4">
        <Skeleton className="rounded-sm" style={{ width: 224, height: LINE_HEIGHT }} />
        <Skeleton className="rounded-sm" style={{ width: 160, height: LINE_HEIGHT }} />
      </div>
    </div>
  );
}
