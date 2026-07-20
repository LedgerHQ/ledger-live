import React from "react";
import { Box, Text } from "@ledgerhq/lumen-ui-rnative";
import { CardLogin } from "../../components/CardLogin/CardLogin.native";
import type { CardLoginViewProps } from "../../components/CardLogin/types";
import type { CardScreenViewModel } from "./useCardScreenViewModel";

type CardScreenViewProps = CardScreenViewModel & {
  readonly cardLogin: CardLoginViewProps;
};

export function CardScreenView({ cardLogin, description, title }: CardScreenViewProps) {
  return (
    <Box style={{ flex: 1 }} lx={{ paddingHorizontal: "s16", paddingVertical: "s16" }}>
      <Box lx={{ flexDirection: "row", alignItems: "center", gap: "s16" }}>
        <Box lx={{ flex: 1, flexDirection: "column", gap: "s4" }} style={{ minWidth: 0 }}>
          <Text typography="heading5SemiBold" lx={{ color: "base" }}>
            {title}
          </Text>
          <Text typography="body2" lx={{ color: "muted" }}>
            {description}
          </Text>
        </Box>
        <CardLogin {...cardLogin} />
      </Box>
    </Box>
  );
}
