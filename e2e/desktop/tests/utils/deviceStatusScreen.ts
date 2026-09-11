import { fetchCurrentScreenTexts } from "@ledgerhq/live-e2e-shared/speculos";
import { getEnv } from "@shared/env";

/**
 * Settles the transient status screen a device app draws *after* it has already
 * answered a command, before the next device interaction in the same session.
 *
 * Why it is needed: the Rust device-SDK status page (`NbglReviewStatus::show`)
 * polls through `ux_sync_wait(false)`. With that flag false, an APDU arriving
 * while the page is up is read from the IO layer and discarded -- the app never
 * processes it and the host never gets a reply. The page is transient, so the
 * command is lost rather than delayed, and a host without a request timeout
 * waits forever.
 *
 * A human is always slower than this window; the harness is not. Chaining a
 * second device interaction straight after one that ends on a status screen is
 * therefore a harness-only race. Measured on Zcash (LIVE-37178): back-to-back
 * Receive flows 400ms apart hang for good, the same flow 5s apart passes.
 *
 * Polls the device screen instead of sleeping a fixed amount, so the cost is the
 * time the screen actually takes rather than a guess about CI load.
 */
const STATUS_SCREEN_UPPER_BOUND_MS = 4500;
const POLL_INTERVAL_MS = 250;

/** The idle screen every app returns to, e.g. "Zcash / app is ready". */
const APP_IDLE_MARKER = "is ready";

export async function settleAfterDeviceStatusScreen(): Promise<void> {
  const port = getEnv("SPECULOS_API_PORT");
  const deadline = Date.now() + STATUS_SCREEN_UPPER_BOUND_MS;

  while (Date.now() < deadline) {
    const texts = (await fetchCurrentScreenTexts(port)).toLowerCase();
    if (texts.includes(APP_IDLE_MARKER)) return;
    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
  }
  // Upper bound reached: the status screen outlived its usual lifetime. Fall
  // through rather than throw -- this is a settle, not an assertion, and the
  // caller's own expectations will report anything actually broken.
}
