const ALLOWED_DADA_HOSTS = new Set(["dada.api.ledger.com", "dada.api.ledger-test.com"]);

/** Guards endpoints that issue their own `fetch` against a mis-resolved base url. */
export function assertDadaApiUrl(url: URL): void {
  if (!ALLOWED_DADA_HOSTS.has(url.hostname)) {
    throw new Error(`Blocked request to untrusted host: ${url.hostname}`);
  }
}
