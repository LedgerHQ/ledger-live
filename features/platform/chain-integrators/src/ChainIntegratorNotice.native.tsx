import React from "react";
import { Box, Text } from "@ledgerhq/lumen-ui-rnative";
import { Information } from "@ledgerhq/lumen-ui-rnative/symbols";
import type { ChainIntegratorNoticeProps } from "./ChainIntegratorNotice.types";
import { useChainIntegratorNotice } from "./useChainIntegratorNotice";

export function ChainIntegratorNotice({ currency }: ChainIntegratorNoticeProps) {
  const label = useChainIntegratorNotice(currency.family);
  if (!label) return null;

  return (
    <Box
      lx={{ flexDirection: "row", alignItems: "center", gap: "s4" }}
      testID="chain-integrator-notice"
    >
      <Information size={16} color="muted" />
      <Text typography="body2" lx={{ flexShrink: 1, color: "muted" }}>
        {label}
      </Text>
    </Box>
  );
}
