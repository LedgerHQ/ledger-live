export function getTrustedDomain(env: "prod" | "test"): string {
  return env === "prod"
    ? "https://nft.api.live.ledger.com"
    : "https://nft.api.live.ledger-test.com";
}
