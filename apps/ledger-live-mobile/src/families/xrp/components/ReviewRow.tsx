import React from "react";
import { Box, Text } from "@ledgerhq/lumen-ui-rnative";

export function ReviewRow({
  label,
  children,
}: Readonly<{ label: string; children: React.ReactNode }>) {
  return (
    <Box lx={{ flexDirection: "row", justifyContent: "space-between", gap: "s16" }}>
      <Text typography="body2" lx={{ color: "muted" }}>
        {label}
      </Text>
      <Box lx={{ flexShrink: 1, alignItems: "flex-end" }}>{children}</Box>
    </Box>
  );
}

export function ReviewValue({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <Text typography="body2SemiBold" lx={{ color: "base", textAlign: "right" }}>
      {children}
    </Text>
  );
}
