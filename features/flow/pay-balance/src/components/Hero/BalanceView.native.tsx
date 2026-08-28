import React from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import type { BalanceViewProps } from "../../types";
import { ActionTiles } from "../ActionTiles";
import { BalanceBody } from "./BalanceBody";

export function BalanceView(props: BalanceViewProps) {
  return (
    <Box testID="pay-card-balance">
      <BalanceBody {...props} />
      {props.actionTiles && (
        <Box lx={{ marginTop: "s40", alignItems: "center", justifyContent: "center" }}>
          <ActionTiles {...props.actionTiles} />
        </Box>
      )}
    </Box>
  );
}
