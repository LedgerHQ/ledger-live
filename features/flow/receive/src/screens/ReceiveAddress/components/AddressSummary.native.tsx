import React from "react";
import CryptoIcon from "@ledgerhq/crypto-icons/native";
import { Box, Text, useTheme } from "@ledgerhq/lumen-ui-rnative";
import { QrCode } from "@shared/ui-qr-code";
import { splitMiddleForTwoLines } from "../../../logic/splitMiddleForTwoLines";
import type { AddressSummaryProps } from "./AddressSummary.types";

const QR_CARD_SIZE = 256;
const QR_SIZE = 208;
const QR_CENTER_ICON_SIZE = 48;

/** The QR card, the asset icon in its middle, then the address on two lines, edges standing out. */
export function AddressSummary({ address }: AddressSummaryProps) {
  const { theme } = useTheme();
  const { start, middle, end } = address.parts;
  const [middleFirstLine, middleSecondLine] = splitMiddleForTwoLines(address.parts);

  return (
    <Box lx={{ alignItems: "center", gap: "s16" }} testID="receive-address-summary">
      {address.label ? (
        <Text typography="body2SemiBold" lx={{ color: "base" }}>
          {address.label}
        </Text>
      ) : null}
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
          value={address.value}
          size={QR_SIZE}
          // The card is white in both themes: the modules stay dark.
          foregroundColor={theme.colors.text.black}
          testID="receive-address-qr-code"
          centerContent={
            <CryptoIcon
              ledgerId={address.assetIcon.ledgerId}
              ticker={address.assetIcon.ticker}
              network={address.assetIcon.network}
              size={QR_CENTER_ICON_SIZE}
              shape="circle"
            />
          }
        />
      </Box>
      <Text
        typography="body2"
        lx={{ color: "muted", textAlign: "center" }}
        testID="receive-address-text"
      >
        <Text typography="body2" lx={{ color: "base" }}>
          {start}
        </Text>
        {middleFirstLine}
        {middle ? "\n" : null}
        {middleSecondLine}
        <Text typography="body2" lx={{ color: "base" }}>
          {end}
        </Text>
      </Text>
    </Box>
  );
}
