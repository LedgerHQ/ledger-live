import React from "react";
import { Box, Spot, Text } from "@ledgerhq/lumen-ui-rnative";
import { Search, Warning } from "@ledgerhq/lumen-ui-rnative/symbols";

const VARIANT_CONFIG = {
  empty: { icon: Search },
  error: { icon: Warning },
} as const;

type AssetStatusStateProps = {
  variant: keyof typeof VARIANT_CONFIG;
  message: string;
  testID?: string;
};

export const AssetStatusState = ({ variant, message, testID }: AssetStatusStateProps) => {
  const { icon } = VARIANT_CONFIG[variant];
  return (
    <Box
      lx={{ alignItems: "center", justifyContent: "center", paddingVertical: "s16" }}
      testID={testID}
    >
      <Spot appearance="icon" icon={icon} size={40} />
      <Text typography="body2SemiBold" lx={{ color: "base", textAlign: "center", marginTop: "s8" }}>
        {message}
      </Text>
    </Box>
  );
};
