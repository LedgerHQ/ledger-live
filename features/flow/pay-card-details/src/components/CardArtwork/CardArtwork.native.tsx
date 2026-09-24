import React from "react";
import { View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { LinearGradient } from "@ledgerhq/lumen-ui-rnative";
import { VISA_LOGO_PATH } from "./assets/visaLogoPath";
import { Halftone } from "./Halftone.native";
import {
  CARD_FACE_BORDER,
  CARD_FACE_TEXT,
  CARD_GRADIENT_END,
  CARD_GRADIENT_START,
} from "./cardColors";

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
      lx={{ borderRadius: "lg", borderWidth: "s1" }}
      style={{
        aspectRatio: CARD_ASPECT_RATIO,
        borderColor: CARD_FACE_BORDER,
        overflow: "hidden",
        width: "100%",
      }}
    >
      <Halftone variant="right" />
      <Halftone variant="left" />

      <View style={{ position: "absolute", top: "8.29%", right: "4.81%" }}>
        <Svg width={53.49} height={17.28} viewBox="0 0 53.49 17.2803" accessibilityLabel="Visa">
          <Path d={VISA_LOGO_PATH} fill={CARD_FACE_TEXT} />
        </Svg>
      </View>
    </LinearGradient>
  );
}
