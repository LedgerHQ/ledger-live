import React from "react";
import { LinearGradient } from "@ledgerhq/lumen-ui-rnative";
import { Halftone } from "./Halftone.native";
import { CARD_GRADIENT_END, CARD_GRADIENT_START } from "./cardColors";

const CARD_ASPECT_RATIO = 343 / 193;

const CARD_GRADIENT_STOPS = [
  { color: CARD_GRADIENT_START, offset: 0 },
  { color: CARD_GRADIENT_END, offset: 1 },
] as const;

export function CardArtwork() {
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
    </LinearGradient>
  );
}
