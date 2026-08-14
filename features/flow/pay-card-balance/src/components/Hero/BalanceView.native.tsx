import React from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import type { BalanceViewProps } from "../../types";
import { BalanceBody } from "./BalanceBody";

export function BalanceView(props: BalanceViewProps) {
  return (
    <Box lx={{ paddingHorizontal: "s16" }} testID="pay-card-balance">
      <BalanceBody {...props} />
    </Box>
  );
}
