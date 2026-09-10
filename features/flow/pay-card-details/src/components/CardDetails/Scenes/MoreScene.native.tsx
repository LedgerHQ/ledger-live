import React from "react";
import { Box, Text } from "@ledgerhq/lumen-ui-rnative";
import { MoreRow } from "../../More/Sheet/MoreRow";
import type { MoreSceneProps } from "./types";

export function MoreScene({ viewModel }: MoreSceneProps) {
  return (
    <Box testID="card-details-more-content">
      <Box lx={{ paddingHorizontal: "s16", paddingBottom: "s24" }}>
        <Text typography="heading3SemiBold" lx={{ color: "base" }}>
          {viewModel.sheetTitle}
        </Text>
      </Box>
      <Box lx={{ flexDirection: "column", marginHorizontal: "s8" }}>
        {viewModel.rows.map(row => (
          <MoreRow key={row.id} row={row} />
        ))}
      </Box>
    </Box>
  );
}
