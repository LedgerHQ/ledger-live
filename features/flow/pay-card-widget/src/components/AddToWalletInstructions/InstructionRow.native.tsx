import React from "react";
import { Avatar, Box, Text } from "@ledgerhq/lumen-ui-rnative";

type Props = {
  readonly number: number;
  readonly label: string;
};

export function InstructionRow({ number, label }: Props) {
  return (
    <Box
      lx={{
        flexDirection: "row",
        alignItems: "center",
        gap: "s12",
        minHeight: "s40",
        paddingHorizontal: "s8",
        paddingVertical: "s8",
      }}
    >
      <Avatar size="xs" fallbackText={String(number)} />
      <Text typography="body2" lx={{ flex: 1, color: "base" }} numberOfLines={2}>
        {label}
      </Text>
    </Box>
  );
}
