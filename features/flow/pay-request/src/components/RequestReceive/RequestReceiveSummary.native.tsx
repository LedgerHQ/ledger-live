import React from "react";
import CryptoIcon from "@ledgerhq/crypto-icons/native";
import { Box, Text, useTheme } from "@ledgerhq/lumen-ui-rnative";
import { QrCode } from "@shared/ui-qr-code";
import { RequestReceiveAddress } from "./RequestReceiveAddress.native";
import type { RequestReceiveIconProps, RequestReceiveProps } from "../../types";
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

  return (
    <Box
      lx={{
        alignSelf: "stretch",
        width: "full",
        backgroundColor: "surface",
        borderRadius: "2xl",
        overflow: "hidden",
      }}
      testID="pay-request-receive-summary"
    >
      <Box
        ref={cardRef}
        collapsable={false}
        lx={{
          alignItems: "center",
          alignSelf: "stretch",
          gap: "s32",
          padding: "s24",
          width: "full",
          backgroundColor: "surface",
        }}
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
    </Box>
  );
}
