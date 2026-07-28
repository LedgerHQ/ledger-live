import { getEnv } from "@shared/env";

export function getTrustedDomain(env: "prod" | "test"): string {
  return env === "prod" ? getEnv("NFT_METADATA_SERVICE") : "https://nft.api.live.ledger-test.com";
}
