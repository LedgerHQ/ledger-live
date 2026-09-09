import React, { useImperativeHandle, useLayoutEffect, useRef, useState, type Ref } from "react";
import { View } from "react-native";
import CryptoIcon from "@ledgerhq/crypto-icons/native";
import { Box, Text, useTheme } from "@ledgerhq/lumen-ui-rnative";
import { QrCode } from "@shared/ui-qr-code";
import { RequestReceiveAddress } from "./RequestReceiveAddress.native";
import type {
  RequestReceiveCardHandle,
  RequestReceiveIconProps,
  RequestReceiveProps,
} from "../../types";
import type { AddressParts } from "../../utils/splitAddress";

const QR_CENTER_ICON_SIZE = 48;
const NETWORK_ICON_SIZE = 20;

type RequestReceiveSummaryProps = Readonly<{
  title: string;
  networkLabel: string;
  assetIcon: RequestReceiveIconProps;
  networkIcon?: RequestReceiveIconProps;
  addressParts: AddressParts;
  qrPayload: string;
  cardRef?: RequestReceiveProps["cardRef"];
}>;

function waitTwoFrames(): Promise<void> {
  return new Promise(resolve => {
    if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => resolve());
      });
      return;
    }
    setTimeout(resolve, 0);
  });
}

export function RequestReceiveSummary({
  title,
  networkLabel,
  assetIcon,
  networkIcon,
  addressParts,
  qrPayload,
  cardRef,
}: RequestReceiveSummaryProps) {
  const { theme } = useTheme();
  const qrForegroundColor = theme?.colors?.text?.base ?? "#FFFFFF";
  const viewRef = useRef<View>(null);
  const [flattenForSnapshot, setFlattenForSnapshot] = useState(false);
  const flattenCommitted = useRef<(() => void) | null>(null);

  useLayoutEffect(() => {
    flattenCommitted.current?.();
    flattenCommitted.current = null;
  });

  useImperativeHandle(cardRef as Ref<RequestReceiveCardHandle | null>, () => ({
    withFlatSnapshot: async run => {
      await new Promise<void>(resolve => {
        flattenCommitted.current = resolve;
        setFlattenForSnapshot(true);
      });
      await waitTwoFrames();
      try {
        return await run(viewRef.current ?? viewRef);
      } finally {
        setFlattenForSnapshot(false);
      }
    },
  }));

  return (
    <Box
      ref={viewRef}
      collapsable={false}
      lx={{
        alignItems: "center",
        alignSelf: "stretch",
        gap: "s32",
        padding: "s24",
        width: "full",
        backgroundColor: "surface",
        ...(flattenForSnapshot ? {} : { borderRadius: "2xl" }),
      }}
      testID="pay-request-receive-summary"
    >
      <Box lx={{ alignItems: "center", gap: "s8" }}>
        <Text typography="heading3SemiBold" lx={{ color: "base", textAlign: "center" }}>
          {title}
        </Text>
        <Box
          lx={{ flexDirection: "row", alignItems: "center", gap: "s8" }}
          testID="pay-request-receive-network"
        >
          {networkIcon ? (
            <CryptoIcon
              ledgerId={networkIcon.ledgerId}
              ticker={networkIcon.ticker}
              network={networkIcon.network}
              size={NETWORK_ICON_SIZE}
              shape="circle"
            />
          ) : null}
          <Text typography="body2" lx={{ color: "muted" }}>
            {networkLabel}
          </Text>
        </Box>
      </Box>
      <QrCode
        value={qrPayload}
        foregroundColor={qrForegroundColor}
        testID="pay-request-receive-qr-code"
        centerContent={
          <CryptoIcon
            ledgerId={assetIcon.ledgerId}
            ticker={assetIcon.ticker}
            size={QR_CENTER_ICON_SIZE}
            shape="circle"
          />
        }
      />
      <RequestReceiveAddress addressParts={addressParts} />
    </Box>
  );
}
