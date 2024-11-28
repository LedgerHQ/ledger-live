import { getEnv } from "@ledgerhq/live-env";

export function getCALDomain(env: "prod" | "test"): string {
  return env === "prod"
    ? getEnv("CAL_SERVICE_URL")
    : "https://crypto-assets-service.api.ledger-test.com";
}
