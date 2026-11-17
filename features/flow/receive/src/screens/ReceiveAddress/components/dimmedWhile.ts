const DIMMED_OPACITY = 0.4;

/**
 * Props that fade a section and make it ignore touches, e.g. behind the verify hint. The section
 * fades as one layer: on Android, each child would fade on its own and the QR code's white
 * background would show over its white card.
 */
export function dimmedWhile(isDimmed: boolean) {
  return isDimmed
    ? ({
        style: { opacity: DIMMED_OPACITY },
        pointerEvents: "none",
        needsOffscreenAlphaCompositing: true,
      } as const)
    : ({} as const);
}
