import React from "react";
import { Box, Text } from "@ledgerhq/lumen-ui-rnative";
import type { CardScreenViewModel } from "./useCardScreenViewModel";

type CardScreenViewProps = CardScreenViewModel;

export function CardScreenView({ description, title }: CardScreenViewProps) {
  return (
    <Box style={{ flex: 1 }}>
      <Box lx={{ paddingHorizontal: "s16", paddingTop: "s16" }}>
        <Box
          lx={{
            backgroundColor: "muted",
            borderRadius: "md",
            padding: "s16",
            flexDirection: "column",
            gap: "s4",
          }}
        >
          <Text typography="body2SemiBold">{title}</Text>
          <Text typography="body3">{description}</Text>
        </Box>
      </Box>
    </Box>
  );
}
