/**
 * Records the PTX (Buy/Sell) handoff URL for e2e tests: the Ledger-owned webview URL
 * carrying `goToManifest` + `goToURL` at the moment the user is sent off to a partner.
 *
 * E2E asserts the handoff contract (provider + query params) on this URL rather than
 * driving into the partner's own page, which is a third-party production site and not
 * something Ledger Live owns. Mirrors what e2e/desktop reads from `webviewUrlHistory`.
 */
let lastHandoffUrl: string | null = null;

export const ptxHandoffStore = {
  set(url: string) {
    lastHandoffUrl = url;
  },

  /** Reads and clears, so a handoff can never be mistaken for a later flow's. */
  take(): string | null {
    const url = lastHandoffUrl;
    lastHandoffUrl = null;
    return url;
  },
};
