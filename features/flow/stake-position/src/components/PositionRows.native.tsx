import React, { type ReactNode } from "react";
import {
  Box,
  DescriptionItem,
  DescriptionItemLabel,
  DescriptionItemLeading,
  DescriptionItemTrailing,
  DescriptionItemValue,
  Text,
} from "@ledgerhq/lumen-ui-rnative";
import type { StakePositionAmount } from "../types";

export function PositionRow({ label, children }: Readonly<{ label: string; children: ReactNode }>) {
  return (
    <DescriptionItem>
      <DescriptionItemLeading>
        <DescriptionItemLabel>{label}</DescriptionItemLabel>
      </DescriptionItemLeading>
      <DescriptionItemTrailing>{children}</DescriptionItemTrailing>
    </DescriptionItem>
  );
}

export function PositionAmount({ amount }: Readonly<{ amount: StakePositionAmount }>) {
  return (
    <Box lx={{ alignItems: "flex-end" }}>
      <DescriptionItemValue>{amount.crypto}</DescriptionItemValue>
      {amount.fiat ? (
        <Text typography="body3" lx={{ color: "muted" }}>
          {amount.fiat}
        </Text>
      ) : null}
    </Box>
  );
}
