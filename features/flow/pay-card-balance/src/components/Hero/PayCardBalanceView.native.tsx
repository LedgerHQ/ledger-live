import React from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import type { PayCardBalanceViewProps } from "../../types";
import { PayCardBalanceBody } from "./PayCardBalanceBody";

export function PayCardBalanceView(props: PayCardBalanceViewProps) {
  return (
    <Box lx={{ paddingHorizontal: "s16" }} testID="pay-card-balance">
      <PayCardBalanceBody {...props} />
    </Box>
  );
}
