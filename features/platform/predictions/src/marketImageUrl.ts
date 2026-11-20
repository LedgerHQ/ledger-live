import { parseURL } from "./url.internals";

// Any other host would let a live app make Ledger Wallet fetch any URL.
const MARKET_IMAGE_HOSTS: ReadonlySet<string> = new Set([
  "polymarket-upload.s3.us-east-2.amazonaws.com",
]);

export function isAllowedMarketImageUrl(imageUrl: string): boolean {
  const url = parseURL(imageUrl);
  return (
    url?.protocol === "https:" &&
    MARKET_IMAGE_HOSTS.has(url.host) &&
    url.username === "" &&
    url.password === ""
  );
}
