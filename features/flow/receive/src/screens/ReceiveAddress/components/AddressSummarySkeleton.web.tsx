import React from "react";
import { Skeleton } from "@ledgerhq/lumen-ui-react";
import { AnimatedQrCode } from "@shared/ui-animated-qr-code/web";

// The final box of the QR card and the address: the 256px card, then two lines of text.
const QR_SIZE = 208;
const QR_CENTER_ICON_SIZE = 48;
const LINE_HEIGHT = 20;

export function AddressSummarySkeleton() {
  return (
    <div className="flex flex-col items-center gap-16" data-testid="receive-address-skeleton">
      <div className="flex size-256 items-center justify-center rounded-2xl bg-white">
        <AnimatedQrCode
          value=""
          size={QR_SIZE}
          animation="loading"
          // Holds the asset icon's place: the code shows a gray disc there while it loads.
          centerContent={
            <div style={{ width: QR_CENTER_ICON_SIZE, height: QR_CENTER_ICON_SIZE }} />
          }
        />
      </div>
      <div className="flex flex-col items-center gap-4">
        <Skeleton className="rounded-sm" style={{ width: 224, height: LINE_HEIGHT }} />
        <Skeleton className="rounded-sm" style={{ width: 160, height: LINE_HEIGHT }} />
      </div>
    </div>
  );
}
