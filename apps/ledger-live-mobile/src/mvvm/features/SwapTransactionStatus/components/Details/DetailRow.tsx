import React from "react";
import { Box, Text } from "@ledgerhq/lumen-ui-rnative";

type DetailRowProps = Readonly<{
  label: string;
  value: React.ReactNode;
  testId?: string;
}>;

export function DetailRow({ label, value, testId }: DetailRowProps) {
  return (
    <Box
      lx={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "s16",
      }}
    >
      <Text typography="body3" lx={{ color: "muted" }}>
        {label}
      </Text>
      {typeof value === "string" ? (
        <Text
          testID={testId}
          typography="body3"
          lx={{ color: "base", textAlign: "right", flexShrink: 1 }}
        >
          {value}
        </Text>
      ) : (
        value
      )}
    </Box>
  );
}
