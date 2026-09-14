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

  let lastSeen = "";
  while (Date.now() < deadline) {
    lastSeen = await fetchCurrentScreenTexts(port);
    if (lastSeen.toLowerCase().includes(APP_IDLE_MARKER)) return;
    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  // Falling through here would let the caller send its next command into the
  // discard window, and that command has no timeout of its own -- the run would
  // hang for the full test timeout with nothing pointing at the cause. Fail here
  // instead, where the reason is still known.
  throw new Error(
    `Device did not return to its idle screen within ${STATUS_SCREEN_UPPER_BOUND_MS}ms. ` +
      `A command sent now would land in the status screen's discard window (LIVE-37178). ` +
      `Last screen text: "${lastSeen}"`,
  );
}
