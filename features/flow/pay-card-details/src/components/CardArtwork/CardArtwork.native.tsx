import React from "react";
import { LinearGradient, useTheme } from "@ledgerhq/lumen-ui-rnative";
import { ledgerLiveThemes } from "@ledgerhq/lumen-design-core";
import { Halftone } from "./Halftone";
import { CardFade } from "./CardFade";
import { CARD_GRADIENT_END, CARD_GRADIENT_START } from "./cardColors";
import type { CardArtworkProps } from "./CardArtwork.types";

const CARD_ASPECT_RATIO = 343 / 193;

const CARD_GRADIENT_STOPS = [
  { color: CARD_GRADIENT_START, offset: 0 },
  { color: CARD_GRADIENT_END, offset: 1 },
] as const;

export function CardArtwork({ isFaded = false }: CardArtworkProps) {
  const { theme } = useTheme();
  const fadeColor = theme.colors.bg?.base ?? ledgerLiveThemes.light.colors.bg.base;

  return (
    <LinearGradient
      direction={120}
      stops={[...CARD_GRADIENT_STOPS]}
      testID="card-artwork"
      lx={{ borderRadius: "lg" }}
      style={{
        aspectRatio: CARD_ASPECT_RATIO,
        overflow: "hidden",
        width: "100%",
      }}
    >
      <Halftone variant="right" />
      <Halftone variant="left" />
      {isFaded ? <CardFade color={fadeColor} /> : null}
    </LinearGradient>
  );
}
