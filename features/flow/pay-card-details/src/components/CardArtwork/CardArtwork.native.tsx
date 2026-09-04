import React from "react";
import { Box, LinearGradient } from "@ledgerhq/lumen-ui-rnative";
import { Halftone } from "./Halftone.native";
import { VisaLogo } from "./assets/VisaLogo.native";

/**
 * The card keeps its Figma proportions instead of the web's fixed 195px height: on mobile the card
 * takes the width it is given, and a static height would squash the artwork on wider screens.
 */
const CARD_ASPECT_RATIO = 16 / 9;

const CARD_GRADIENT_ANGLE = 119.51;

const CARD_GRADIENT_STOPS = [
  { color: "rgb(0, 0, 0)", offset: 0 },
  { color: "rgb(31, 31, 31)", offset: 1 },
];

/**
 * Figma places each piece with insets on all four edges. React Native has no `calc()`, so the boxes
 * are expressed as origin plus size — the same geometry — and the sub-pixel terms of those insets,
 * all under 2.5px, are dropped.
 */
const LAYOUT = {
  halftoneLeft: { top: "30.57%", left: "-37.03%", width: "80.12%", height: "142.37%" },
  halftoneRight: { top: "-55.44%", left: "79.34%", width: "76.97%", height: "136.79%" },
  visaLogo: { top: "8.29%", left: "79.59%", width: "15.60%", height: "8.95%" },
} as const;

/**
 * The physical card face: a dark gradient with the decorative halftone artwork and the network
 * logo. It is always dark, independent of the app theme, so the gradient colors are literal.
 */
export function CardArtwork() {
  return (
    <LinearGradient
      testID="card-artwork"
      direction={CARD_GRADIENT_ANGLE}
      stops={CARD_GRADIENT_STOPS}
      lx={{ width: "full", borderRadius: "lg", borderWidth: "s1", borderColor: "mutedSubtle" }}
      style={{ aspectRatio: CARD_ASPECT_RATIO }}
    >
      <Box lx={{ position: "absolute" }} style={LAYOUT.halftoneLeft}>
        <Halftone side="left" />
      </Box>
      <Box lx={{ position: "absolute" }} style={LAYOUT.halftoneRight}>
        <Halftone side="right" />
      </Box>
      <Box lx={{ position: "absolute" }} style={LAYOUT.visaLogo}>
        <VisaLogo />
      </Box>
    </LinearGradient>
  );
}
