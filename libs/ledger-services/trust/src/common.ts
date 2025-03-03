import { getEnv } from "@ledgerhq/live-env";

export function getTrustedDomain(env: "prod" | "test"): string {
  return env === "prod"
    ? getEnv("NFT_ETH_METADATA_SERVICE")
    : "https://nft.api.live.ledger-test.com";
}
