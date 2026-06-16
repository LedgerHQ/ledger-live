const DEFAULT_CVS_BASE_URL = "https://countervalues.live.ledger.com";

let cvsBaseUrl = DEFAULT_CVS_BASE_URL;

/**
 * Overrides the Countervalues Service base URL. Apps call this at startup with
 * their own env (e.g. `getEnv("LEDGER_COUNTERVALUES_API")`) so this package
 * stays free of any env/config dependency.
 */
export function setCvsBaseUrl(url: string): void {
  cvsBaseUrl = url;
}

/** Current Countervalues Service base URL. */
export function getCvsBaseUrl(): string {
  return cvsBaseUrl;
}
