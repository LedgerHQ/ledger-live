import React from "react";
import CryptoIcon from "@ledgerhq/crypto-icons/native";
import { Box, Text } from "@ledgerhq/lumen-ui-rnative";
import type { ReceiveIcon } from "../../../logic/toReceiveAddressData";

const NETWORK_ICON_SIZE = 20;

type Props = Readonly<{
  title: string;
  networkLabel: string;
  networkIcon?: ReceiveIcon;
}>;

export function ReceiveAddressTitle({ title, networkLabel, networkIcon }: Props) {
  return (
    <Box lx={{ alignItems: "center", gap: "s8" }}>
      <Text
        typography="heading2SemiBold"
        lx={{ color: "base", textAlign: "center" }}
        numberOfLines={2}
      >
        {title}
      </Text>
      <Box lx={{ flexDirection: "row", alignItems: "center", gap: "s8" }}>
        {networkIcon ? (
          <CryptoIcon
            ledgerId={networkIcon.ledgerId}
            ticker={networkIcon.ticker}
            size={NETWORK_ICON_SIZE}
            shape="square"
          />
        ) : null}
        <Text typography="body2" lx={{ color: "base", flexShrink: 1 }} numberOfLines={1}>
          {networkLabel}
        </Text>
      </Box>
    </Box>
  );
}
