import { DateTimeIsoSchema } from "@shared/schema-primitives";
import { z } from "zod";

/** `<major>` or `<major>.<minor>`, no leading zeros, no patch segment. */
const POLICY_VERSION_STRING = /^[1-9]\d*(\.(0|[1-9]\d*))?$/;

export type PolicyVersion = {
  major: number;
  minor: number;
  normalized: string;
};

function toPolicyVersion(value: number | string): PolicyVersion {
  const [major, minor = "0"] = String(value).split(".");
  return { major: Number(major), minor: Number(minor), normalized: `${major}.${minor}` };
}

/**
 * Accepts `1`, `"1"`, `"1.0"`, `"2.10"`. Rejects decimal numbers such as `1.2`,
 * leading zeros, patch segments and decorated versions.
 */
export const policyVersionSchema = z
  .union([z.number().int().positive(), z.string().regex(POLICY_VERSION_STRING)])
  .transform(toPolicyVersion);

export function parsePolicyVersion(value: unknown): PolicyVersion | null {
  const result = policyVersionSchema.safeParse(value);
  return result.success ? result.data : null;
}

/**
 * Reads a version previously written to storage, which clients released before LIVE-29593 wrote
 * through `z.coerce.number()`: a remote `"1.4"` reached them as the float `1.4`. Stored numbers are
 * therefore read via their decimal form so those users are not asked to reconsent after updating.
 * `"2.10"` coerced to `2.1` under-reads the minor and costs one extra acknowledgement, which is the
 * milder failure of the two.
 */
export function parseStoredPolicyVersion(value: unknown): PolicyVersion | null {
  if (typeof value === "number") {
    return parsePolicyVersion(String(value));
  }
  return parsePolicyVersion(value);
}

export function comparePolicyVersions(a: PolicyVersion, b: PolicyVersion): number {
  return a.major - b.major || a.minor - b.minor;
}

/**
 * Consent dates are written with `Date.prototype.toISOString`, so anything that is not a valid
 * RFC 3339 instant is corrupted state. Validating rather than relying on `Date.parse` — which
 * accepts implementation-defined formats such as `"Jan 15, 2026"` — keeps a garbage date from
 * passing as a valid consent.
 */
export function parseConsentDate(value: unknown): Date | null {
  const result = DateTimeIsoSchema.safeParse(value);
  return result.success ? new Date(result.data) : null;
}

/** Legacy state holds a bare number; acknowledgements since LIVE-29593 hold a normalized string. */
export const storedPolicyVersionSchema = z.union([z.number(), z.string()]).nullable();

export const analyticsConsentInfoSchema = z.object({
  consentDate: z.string().nullable(),
  privacyPolicyVersion: storedPolicyVersionSchema,
});

export type AnalyticsConsentInfo = z.infer<typeof analyticsConsentInfoSchema>;

export const defaultAnalyticsConsentInfo: AnalyticsConsentInfo = {
  consentDate: null,
  privacyPolicyVersion: null,
};
