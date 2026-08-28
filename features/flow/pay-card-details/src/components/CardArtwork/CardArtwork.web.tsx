import React from "react";
import halftoneLeft from "./assets/halftoneLeft.svg";
import halftoneRight from "./assets/halftoneRight.svg";
import visaLogo from "./assets/visaLogo.svg";

/**
 * The physical card face: a dark gradient with the decorative halftone artwork and the network
 * logo. It is always dark, independent of the app theme, so the gradient colors are literal.
 * Percentage-based insets come straight from Figma so the artwork scales with the card width.
 */
const CARD_GRADIENT = "linear-gradient(119.51deg, rgb(0, 0, 0) 0%, rgb(31, 31, 31) 100%)";

export function CardArtwork() {
  return (
    <div
      data-testid="card-artwork"
      className="relative h-[195px] w-full overflow-hidden rounded-lg border border-muted-subtle"
      style={{ backgroundImage: CARD_GRADIENT }}
    >
      <div
        className="absolute"
        style={{
          inset:
            "calc(30.57% - 0.39px) calc(56.91% + 0.14px) calc(-72.94% - 2.46px) calc(-37.03% - 1.74px)",
        }}
      >
        <img alt="" className="block size-full max-w-none" src={halftoneLeft} />
      </div>
      <div
        className="absolute"
        style={{
          inset:
            "calc(-55.44% - 2.11px) calc(-56.31% - 2.13px) calc(18.65% - 0.63px) calc(79.34% + 0.59px)",
        }}
      >
        <img alt="" className="block size-full max-w-none" src={halftoneRight} />
      </div>
      <div
        className="absolute"
        style={{
          inset:
            "calc(8.29% - 0.83px) calc(4.81% - 0.9px) calc(82.76% + 0.66px) calc(79.59% + 0.59px)",
        }}
      >
        <img alt="Visa" className="block size-full max-w-none" src={visaLogo} />
      </div>
    </div>
  );
}
