import React from "react";
import { Box, Spot, Text } from "@ledgerhq/lumen-ui-rnative";
import { Search } from "@ledgerhq/lumen-ui-rnative/symbols";

type AssetEmptyStateProps = {
  message: string;
  testID?: string;
};

export const AssetEmptyState = ({ message, testID }: AssetEmptyStateProps) => (
  <Box
    lx={{ alignItems: "center", justifyContent: "center", paddingVertical: "s16" }}
    testID={testID}
  >
    <Spot appearance="icon" icon={Search} size={40} />
    <Text typography="body2SemiBold" lx={{ color: "base", textAlign: "center", marginTop: "s8" }}>
      {message}
    </Text>
  </Box>
);
