import React from "react";
import { CARD_GRADIENT } from "./cardGradient";
import halftoneLeft from "./assets/halftoneLeft.svg";
import halftoneRight from "./assets/halftoneRight.svg";

const HALFTONE_LEFT_INSET =
  "calc(30.57% - 0.39px) calc(56.91% + 0.14px) calc(-72.94% - 2.46px) calc(-37.03% - 1.74px)";
const HALFTONE_RIGHT_INSET =
  "calc(-55.44% - 2.11px) calc(-56.31% - 2.13px) calc(18.65% - 0.63px) calc(79.34% + 0.59px)";

export function CardArtwork() {
  return (
    <div
      data-testid="card-artwork"
      className="relative h-[195px] w-full overflow-hidden rounded-lg"
      style={{ backgroundImage: CARD_GRADIENT }}
    >
      <div className="absolute" style={{ inset: HALFTONE_LEFT_INSET }}>
        <img alt="" className="block size-full max-w-none" src={halftoneLeft} />
      </div>
      <div className="absolute" style={{ inset: HALFTONE_RIGHT_INSET }}>
        <img alt="" className="block size-full max-w-none" src={halftoneRight} />
      </div>
    </div>
  );
}
