const DIMMED_OPACITY = 0.4;

/** Props that fade a section and make it ignore touches, e.g. behind the verify hint. */
export function dimmedWhile(isDimmed: boolean) {
  return isDimmed
    ? ({ style: { opacity: DIMMED_OPACITY }, pointerEvents: "none" } as const)
    : ({} as const);
}
