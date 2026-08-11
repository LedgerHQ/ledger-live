/** Minimum readable banner width in the Braze placement grid (px). */
export const MIN_BRAZE_BANNER_WIDTH = 343;

/** Gap between banners in the Braze placement grid (px). Must match Tailwind `gap-16`. */
export const BRAZE_PLACEMENT_GRID_GAP = 16;

/** Container width above which two side-by-side banners stay wider than {@link MIN_BRAZE_BANNER_WIDTH}. */
export const BRAZE_PLACEMENT_TWO_COLUMN_MIN_CONTAINER_WIDTH =
  MIN_BRAZE_BANNER_WIDTH * 2 + BRAZE_PLACEMENT_GRID_GAP + 1;

/** Last container width (px) that keeps a single-column Braze placement grid. */
export const BRAZE_PLACEMENT_NARROW_MAX_CONTAINER_WIDTH =
  BRAZE_PLACEMENT_TWO_COLUMN_MIN_CONTAINER_WIDTH - 1;

/** Query context for the portfolio Braze placement row. Must wrap {@link BRAZE_PLACEMENT_GRID_CLASS_NAME}. */
export const BRAZE_PLACEMENT_CONTAINER_CLASS_NAME = "@container w-full";

/**
 * Tailwind container-query grid for portfolio Braze placements.
 * Breakpoints must stay in sync with {@link BRAZE_PLACEMENT_TWO_COLUMN_MIN_CONTAINER_WIDTH}.
 */
export const BRAZE_PLACEMENT_GRID_CLASS_NAME =
  "grid w-full grid-cols-1 gap-16 [&>*]:min-w-0 @min-[703px]:grid-cols-2 @max-[702px]:[&>:nth-child(n+2)]:hidden";
