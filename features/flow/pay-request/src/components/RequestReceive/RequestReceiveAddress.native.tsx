import React from "react";
import { Text } from "@ledgerhq/lumen-ui-rnative";
import type { AddressParts } from "../../utils/splitAddress";
import { splitMiddleForTwoLines } from "../../utils/splitMiddleForTwoLines.native";

type RequestReceiveAddressProps = Readonly<{
  addressParts: AddressParts;
}>;

export function RequestReceiveAddress({ addressParts }: RequestReceiveAddressProps) {
  const { start, middle, end } = addressParts;
  const [middleFirstLine, middleSecondLine] = splitMiddleForTwoLines(addressParts);

  return (
    <Text
      typography="body2"
      lx={{ color: "muted", textAlign: "center" }}
      testID="pay-request-receive-address"
    >
      <Text typography="body2SemiBold" lx={{ color: "base" }}>
        {start}
      </Text>
      {middleFirstLine}
      {middle ? "\n" : null}
      {middleSecondLine}
      <Text typography="body2SemiBold" lx={{ color: "base" }}>
        {end}
      </Text>
    </Text>
  );
}
