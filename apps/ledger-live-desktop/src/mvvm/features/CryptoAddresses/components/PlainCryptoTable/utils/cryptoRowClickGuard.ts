/** Short window to drop the "ghost" click that hits the row after an overlay dismiss (Radix dialog). */
const SUPPRESS_MS = 500;

let suppressUntilMs = 0;

export function markRowClickSuppressedAfterEditDialogOverlayDismiss(): void {
  suppressUntilMs = Date.now() + SUPPRESS_MS;
}

export function shouldSuppressCryptoTableRowClick(): boolean {
  return Date.now() < suppressUntilMs;
}
