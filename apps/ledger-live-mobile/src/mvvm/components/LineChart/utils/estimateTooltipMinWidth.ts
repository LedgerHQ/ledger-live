import type { LineChartPointTooltip } from "../types";

/**
 * The scrubber tooltip auto-fits its width from async `getBBox` measurements of
 * the rendered SVG text. On native, `getBBox` can resolve to `0` (or stay stale
 * when moving between markers that share the same labels), which collapses the
 * box to its `minWidth` floor. The right-aligned value then overlaps the
 * left-aligned label and clips it (e.g. "Received" renders as "Receive").
 *
 * To make the layout robust to unreliable measurement, we pass a `minWidth`
 * derived from the tooltip's own content: a conservative pixel estimate that is
 * guaranteed to reserve enough room for the widest row even if `getBBox` fails.
 * Over-estimating only widens the box slightly; it never clips.
 *
 * The structural constants below mirror `DefaultScrubberTooltip` in
 * `@ledgerhq/lumen-ui-rnative-visualization` (PADDING_X, LABEL_VALUE_GAP). The
 * per-character width is an upper bound for the `body4` sans font used by the
 * tooltip (covering `$`, digits and capitals).
 */
const APPROX_CHAR_WIDTH = 8;
const PADDING_X = 8;
const LABEL_VALUE_GAP = 12;

/** Floor matching the library's `DEFAULT_TOOLTIP_MIN_WIDTH`, so we never shrink below it. */
const DEFAULT_MIN_WIDTH = 80;

function estimateTextWidth(text: string): number {
  return text.length * APPROX_CHAR_WIDTH;
}

/**
 * Estimates a safe `minWidth` (in pixels) for a scrubber tooltip from its title
 * and rows. A title spans the full row; each label/value row needs room for the
 * label, the gap, and the right-aligned value. Returns at least
 * {@link DEFAULT_MIN_WIDTH}.
 */
export function estimateTooltipMinWidth(tooltip: LineChartPointTooltip): number {
  const titleWidth = tooltip.title ? estimateTextWidth(tooltip.title) : 0;

  const rowWidths = tooltip.rows.map(
    row => estimateTextWidth(row.label) + LABEL_VALUE_GAP + estimateTextWidth(row.value),
  );

  const contentWidth = Math.max(titleWidth, ...rowWidths, 0);
  return Math.max(DEFAULT_MIN_WIDTH, Math.ceil(contentWidth + PADDING_X * 2));
}
