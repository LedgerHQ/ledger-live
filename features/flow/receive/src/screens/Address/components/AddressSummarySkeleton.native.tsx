import React from "react";
import { Box, Skeleton } from "@ledgerhq/lumen-ui-rnative";

// Same box as AddressSummary: the 256px QR card, then two lines of the address text.
const QR_CARD_SIZE = 256;
const LINE_HEIGHT = 20;

export function AddressSummarySkeleton() {
  return (
    <Box lx={{ alignItems: "center", gap: "s16" }} testID="receive-address-skeleton">
      <Skeleton
        lx={{ borderRadius: "2xl" }}
        style={{ width: QR_CARD_SIZE, height: QR_CARD_SIZE }}
        testID="receive-address-qr-skeleton"
      />
      <Box lx={{ alignItems: "center", gap: "s4" }}>
        <Skeleton lx={{ borderRadius: "sm" }} style={{ width: 224, height: LINE_HEIGHT }} />
        <Skeleton lx={{ borderRadius: "sm" }} style={{ width: 160, height: LINE_HEIGHT }} />
      </Box>
    </Box>
  );
}
