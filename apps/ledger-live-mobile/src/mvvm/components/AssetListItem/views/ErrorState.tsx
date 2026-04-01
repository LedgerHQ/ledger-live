import React from "react";
import { Box, Spot, Text } from "@ledgerhq/lumen-ui-rnative";
import { Warning } from "@ledgerhq/lumen-ui-rnative/symbols";

type AssetErrorStateProps = {
  message: string;
  testID?: string;
};

export const AssetErrorState = ({ message, testID }: AssetErrorStateProps) => (
  <Box
    lx={{ alignItems: "center", justifyContent: "center", paddingVertical: "s16" }}
    testID={testID}
  >
    <Spot appearance="icon" icon={Warning} size={40} />
    <Text typography="body2SemiBold" lx={{ color: "base", textAlign: "center", marginTop: "s8" }}>
      {message}
    </Text>
  </Box>
);
