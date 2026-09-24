import React from "react";
import { LinearGradient } from "@ledgerhq/lumen-ui-rnative";

const CARD_HEIGHT = 193;
const FADE_HEIGHT = 142;
const FADE_HEIGHT_PERCENTAGE = `${((FADE_HEIGHT / CARD_HEIGHT) * 100).toFixed(2)}%` as `${number}%`;

const FADE_OPAQUE_FROM = 0.8156;

type CardFadeProps = Readonly<{
  color: string;
}>;

export function CardFade({ color }: CardFadeProps) {
  return (
    <LinearGradient
      direction="to-bottom"
      stops={[
        { color, offset: 0, opacity: 0 },
        { color, offset: FADE_OPAQUE_FROM, opacity: 1 },
        { color, offset: 1, opacity: 1 },
      ]}
      pointerEvents="none"
      testID="card-visual-fade"
      lx={{ position: "absolute" }}
      style={{
        bottom: 0,
        left: 0,
        right: 0,
        height: FADE_HEIGHT_PERCENTAGE,
      }}
    />
  );
}
