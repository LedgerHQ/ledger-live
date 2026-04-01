import React from "react";
import { Box, Text } from "@ledgerhq/lumen-ui-rnative";
import { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";

type Props = Readonly<{
  label: string;
}>;

export default function CryptoAddressesEmptyState({ label }: Props) {
  return (
    <Box lx={containerStyle}>
      <Text typography="body2" lx={{ color: "muted" }}>
        {label}
      </Text>
    </Box>
  );
}

const containerStyle: LumenViewStyle = {
  paddingVertical: "s32",
  alignItems: "center",
};
