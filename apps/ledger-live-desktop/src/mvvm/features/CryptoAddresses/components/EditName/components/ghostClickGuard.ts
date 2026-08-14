/** How long after opening to ignore outside-click closes (ghost-click guard). */
export const GHOST_CLICK_GUARD_MS = 300;

export function isWithinGhostClickGuard(openedAtMs: number, nowMs = Date.now()) {
  return nowMs - openedAtMs < GHOST_CLICK_GUARD_MS;
}
