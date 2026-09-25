import React from "react";
import { Box, Skeleton, useTheme } from "@ledgerhq/lumen-ui-rnative";
import { ledgerLiveThemes } from "@ledgerhq/lumen-design-core";
import { CardVisualView } from "./CardVisualView";
import type { CardVisualProps } from "../../types";

export function CardLoadingVisual(props: CardVisualProps) {
  const { theme } = useTheme();
  const fadeColor = theme.colors.bg?.base ?? ledgerLiveThemes.light.colors.bg.base;

  return (
    <Box lx={{ position: "relative" }}>
      <CardVisualView {...props} isFrozen={false} fadeColor={fadeColor} />
      <Box
        lx={{ flexDirection: "row", gap: "s8", position: "absolute" }}
        style={{ bottom: 0, left: 0, right: 0 }}
      >
        <Skeleton
          lx={{ flex: 1, height: "s48", borderRadius: "full" }}
          testID="card-top-up-skeleton"
        />
        <Skeleton
          lx={{ flex: 1, height: "s48", borderRadius: "full" }}
          testID="card-details-skeleton"
        />
      </Box>
    </Box>
  );
}
