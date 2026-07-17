import { getEnv } from "@ledgerhq/live-env";

export type ServiceOption = {
  env?: "prod" | "test";
  signatureKind?: "prod" | "test";
  ref?: string | undefined;
};
export const DEFAULT_OPTION: ServiceOption = {
  env: "prod",
  signatureKind: "prod",
  ref: getEnv<string>("CAL_REF") || undefined,
};
export const STAGING_ENV = { env: "test" } satisfies ServiceOption;

export function getCALDomain(env: "prod" | "test"): string {
  return env === "prod"
    ? getEnv<string>("CAL_SERVICE_URL")
    : getEnv<string>("CAL_SERVICE_URL_STAGING");
}
