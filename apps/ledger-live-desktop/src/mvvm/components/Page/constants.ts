/**
 * Scroll threshold (in pixels) before showing the scroll-to-top button
 */
export const SCROLL_UP_BUTTON_THRESHOLD = 800;

/**
 * Width of the right panel (swap sidebar) in pixels
 */
export const RIGHT_PANEL_WIDTH = 375;

/**
 * Custom event name dispatched when the app should scroll the page to top
 * (e.g. when user clicks Home in the sidebar while already on home).
 * usePageViewModel listens for this and scrolls the page scroller element.
 */
export const SCROLL_TO_TOP_EVENT = "ledger-live:scroll-to-top";
