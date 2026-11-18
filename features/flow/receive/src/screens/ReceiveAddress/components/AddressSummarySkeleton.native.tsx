import React from "react";
import { Box, Skeleton } from "@ledgerhq/lumen-ui-rnative";
import { AnimatedQrCode } from "@shared/ui-animated-qr-code/native";

// The final box of the QR card and the address: the 256px card, then two lines of text.
const QR_CARD_SIZE = 256;
const QR_SIZE = 208;
const QR_CENTER_ICON_SIZE = 48;
const LINE_HEIGHT = 20;

export function AddressSummarySkeleton() {
  return (
    <Box lx={{ alignItems: "center", gap: "s16" }} testID="receive-address-skeleton">
      <Box
        lx={{
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "white",
          borderRadius: "2xl",
        }}
        style={{ width: QR_CARD_SIZE, height: QR_CARD_SIZE }}
      >
        <AnimatedQrCode
          value=""
          size={QR_SIZE}
          animation="loading"
          // Holds the asset icon's place: the code shows a gray disc there while it loads.
          centerContent={
            <Box style={{ width: QR_CENTER_ICON_SIZE, height: QR_CENTER_ICON_SIZE }} />
          }
        />
      </Box>
      <Box lx={{ alignItems: "center", gap: "s4" }}>
        <Skeleton lx={{ borderRadius: "sm" }} style={{ width: 224, height: LINE_HEIGHT }} />
        <Skeleton lx={{ borderRadius: "sm" }} style={{ width: 160, height: LINE_HEIGHT }} />
      </Box>
    </Box>
  );
}
