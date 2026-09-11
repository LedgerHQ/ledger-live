/**
 * Settling helper for the transient status screen a device app draws after it has
 * already answered a command.
 *
 * Why this is needed: the Rust device-SDK status page (`NbglReviewStatus::show`)
 * runs its own event loop through `ux_sync_wait(false)`. With that flag false, an
 * APDU arriving while the page is up is read from the IO layer and discarded --
 * the app never processes it and the host never gets a reply. The page is
 * transient (3s by SDK design), so the command is lost rather than delayed, and a
 * host without a request timeout waits forever.
 *
 * A human is always slower than this window; the harness is not. Chaining a second
 * device interaction straight after one that ends on a status screen is therefore a
 * harness-only race, and this helper removes it. It is not a workaround for a
 * product defect: it stops the suite from testing a cadence no user can produce.
 *
 * Measured on Zcash (LIVE-37178): back-to-back Receive flows 400ms apart hang for
 * good, the same flow 5s apart passes.
 */
export const DEVICE_STATUS_SCREEN_MS = 3000;

/** Margin over the SDK's own 3s page so a loaded CI host stays inside the bound. */
const SETTLE_MARGIN_MS = 1500;

/**
 * Waits out the device's post-reply status screen before the next device call.
 * Call this between two device interactions in the same Speculos session.
 */
export async function settleAfterDeviceStatusScreen(): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, DEVICE_STATUS_SCREEN_MS + SETTLE_MARGIN_MS));
}
