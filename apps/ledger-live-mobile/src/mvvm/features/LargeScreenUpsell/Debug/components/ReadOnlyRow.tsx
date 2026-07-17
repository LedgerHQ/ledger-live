import React from "react";
import { Box, Text } from "@ledgerhq/lumen-ui-rnative";

interface ReadOnlyRowProps {
  label: string;
  value: string;
}

export const ReadOnlyRow = ({ label, value }: ReadOnlyRowProps) => (
  <Box
    lx={{
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: "s4",
    }}
  >
    <Text typography="body3" lx={{ color: "muted" }}>
      {label}
    </Text>
    <Text typography="body3SemiBold" lx={{ color: "base" }}>
      {value}
    </Text>
  </Box>
);
