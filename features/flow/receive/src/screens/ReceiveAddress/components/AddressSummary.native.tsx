import React from "react";
import Animated, { FadeIn } from "react-native-reanimated";
import CryptoIcon from "@ledgerhq/crypto-icons/native";
import { Box, Text } from "@ledgerhq/lumen-ui-rnative";
import { AnimatedQrCode } from "@shared/ui-animated-qr-code/native";
import { splitMiddleForTwoLines } from "../../../logic/splitMiddleForTwoLines";
import type { AddressSummaryProps } from "./AddressSummary.types";

const QR_CARD_SIZE = 256;
const QR_SIZE = 208;
const QR_CENTER_ICON_SIZE = 48;
// The code appears with a short fade once the address is read.
const QR_FADE_IN_MS = 400;

export function AddressSummary({ address, onCopy, copyLabel, copyKey }: AddressSummaryProps) {
  const { start, middle, end } = address.parts;
  const [middleFirstLine, middleSecondLine] = splitMiddleForTwoLines(address.parts);

  return (
    <Box lx={{ alignItems: "center", gap: "s16" }} testID="receive-address-summary">
      {address.label ? (
        <Text typography="body2SemiBold" lx={{ color: "base" }}>
          {address.label}
        </Text>
      ) : null}
      <Animated.View entering={FadeIn.duration(QR_FADE_IN_MS)}>
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
            value={address.value}
            size={QR_SIZE}
            animation="ripple"
            onPress={onCopy}
            accessibilityLabel={copyLabel}
            triggerKey={copyKey}
            testID="receive-address-qr-code"
            centerContent={
              address.assetIcon ? (
                <CryptoIcon
                  ledgerId={address.assetIcon.ledgerId}
                  ticker={address.assetIcon.ticker}
                  size={QR_CENTER_ICON_SIZE}
                  shape="circle"
                />
              ) : undefined
            }
          />
        </Box>
      </Animated.View>
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
