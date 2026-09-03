import React, { type Ref } from "react";
import type { View } from "react-native";
import CryptoIcon from "@ledgerhq/crypto-icons/native";
import { Box, Text } from "@ledgerhq/lumen-ui-rnative";
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
  return (
    <Box
      ref={cardRef as Ref<View>}
      // captureRef needs a real native view; without this the snapshot is only the card background.
      collapsable={false}
      lx={{
        alignItems: "center",
        alignSelf: "stretch",
        backgroundColor: "surface",
        borderRadius: "2xl",
        gap: "s32",
        padding: "s24",
        width: "full",
      }}
      testID="pay-request-receive-summary"
    >
      <Box lx={{ alignItems: "center", gap: "s8" }}>
        <Text typography="heading3SemiBold" lx={{ color: "base", textAlign: "center" }}>
          {title}
        </Text>
        <Box
          lx={{ flexDirection: "row", alignItems: "center", gap: "s6" }}
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
