import React from "react";
import CryptoIcon from "@ledgerhq/crypto-icons/native";
import { Box, useTheme } from "@ledgerhq/lumen-ui-rnative";
import { QrCode } from "@shared/ui-qr-code";
import { AddressText } from "./AddressText";
import type { ReceiveAddressIconProps } from "../../../types";
import type { AddressParts } from "../../../utils/splitAddress";

const QR_CARD_SIZE = 256;
const QR_SIZE = 208;
const QR_CENTER_ICON_SIZE = 48;

type AddressSummaryProps = Readonly<{
  assetIcon: ReceiveAddressIconProps;
  addressParts: AddressParts;
  qrPayload: string;
}>;

export function AddressSummary({ assetIcon, addressParts, qrPayload }: AddressSummaryProps) {
  const { theme } = useTheme();

  return (
    <Box lx={{ alignItems: "center", gap: "s16" }} testID="receive-address-summary">
      <Box
        lx={{
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "white",
          borderRadius: "2xl",
        }}
        style={{ width: QR_CARD_SIZE, height: QR_CARD_SIZE }}
      >
        <QrCode
          value={qrPayload}
          size={QR_SIZE}
          // The QR card is white in both themes, so the modules stay black.
          foregroundColor={theme.colors.text.black}
          testID="receive-address-qr-code"
          centerContent={
            <CryptoIcon
              ledgerId={assetIcon.ledgerId}
              ticker={assetIcon.ticker}
              network={assetIcon.network}
              size={QR_CENTER_ICON_SIZE}
              shape="circle"
            />
          }
        />
      </Box>
      <AddressText addressParts={addressParts} />
    </Box>
  );
}
