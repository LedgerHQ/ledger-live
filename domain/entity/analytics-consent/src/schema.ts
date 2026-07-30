import { DateTimeIsoSchema } from "@shared/schema-primitives";
import { z } from "zod";

const POLICY_VERSION_REGEX = /^[1-9]\d*(\.(0|[1-9]\d*))?$/;

export type PolicyVersion = {
  major: number;
  minor: number;
  normalized: string;
};

export const policyVersionSchema = z
  .union([z.number().int().positive(), z.string().regex(POLICY_VERSION_REGEX)])
  .transform(value => {
    const [major, minor = "0"] = String(value).split(".");
    return { major: Number(major), minor: Number(minor), normalized: `${major}.${minor}` };
  });

export function parsePolicyVersion(value: unknown): PolicyVersion | null {
  const result = policyVersionSchema.safeParse(value);
  return result.success ? result.data : null;
}

export function parseStoredPolicyVersion(value: unknown): PolicyVersion | null {
  return parsePolicyVersion(typeof value === "number" ? String(value) : value);
}

export function comparePolicyVersions(a: PolicyVersion, b: PolicyVersion): number {
  return a.major - b.major || a.minor - b.minor;
}

export function parseConsentDate(value: unknown): Date | null {
  const result = DateTimeIsoSchema.safeParse(value);
  return result.success ? new Date(result.data) : null;
}

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
