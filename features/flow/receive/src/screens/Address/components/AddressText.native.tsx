import React from "react";
import { Text } from "@ledgerhq/lumen-ui-rnative";
import type { AddressParts } from "../../../utils/splitAddress";
import { splitMiddleForTwoLines } from "../../../utils/splitMiddleForTwoLines";

type AddressTextProps = Readonly<{
  addressParts: AddressParts;
}>;

export function AddressText({ addressParts }: AddressTextProps) {
  const { start, middle, end } = addressParts;
  const [middleFirstLine, middleSecondLine] = splitMiddleForTwoLines(addressParts);

  return (
    <Text
      typography="body2"
      lx={{ color: "muted", textAlign: "center" }}
      testID="receive-address-address"
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
  );
}
