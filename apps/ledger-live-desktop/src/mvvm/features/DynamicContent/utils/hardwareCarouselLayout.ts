export const HARDWARE_CAROUSEL_SEPARATOR_PX = 32;
export const HARDWARE_CAROUSEL_ITEM_GAP_PX = HARDWARE_CAROUSEL_SEPARATOR_PX / 2;

/**
 * Fixed design value, intentionally not responsive to the desktop window width: it matches
 * the visual card size mobile gets from `WidthFactor.Half` (half of a 390px reference phone
 * viewport, minus the card's horizontal padding), per the Figma spec. Desktop keeps this same
 * card size regardless of window width rather than scaling to half of the (much wider) desktop
 * carousel container.
 */
export const HARDWARE_CAROUSEL_SLIDE_WIDTH_PX = 131;
