// React Navigation keeps the leading slash when it strips an https prefix (ledger.go.link, adj.st),
// which would turn the first segment into the URL's path instead of its hostname.
export function parseDeeplinkPath(path: string) {
  return new URL(`ledgerwallet://${path.replace(/^\/+/, "")}`);
}
