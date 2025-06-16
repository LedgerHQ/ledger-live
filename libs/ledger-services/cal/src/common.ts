import { getEnv } from "@ledgerhq/live-env";

export type ServiceOption = {
  env?: "prod" | "test";
  signatureKind?: "prod" | "test";
  ref?: string | undefined;
};
export const DEFAULT_OPTION: ServiceOption = {
  env: "prod",
  signatureKind: "prod",
  ref: undefined,
};
export const STAGING_ENV = { env: "test" } satisfies ServiceOption;

export function getCALDomain(env: "prod" | "test"): string {
  return env === "prod"
    ? getEnv("CAL_SERVICE_URL")
    : "https://crypto-assets-service.api.ledger-test.com";
}
