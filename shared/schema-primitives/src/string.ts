import { z } from "zod";

/** Opaque identifier for a currency (e.g. `"bitcoin"`, `"ethereum"`). Non-empty string. */
export const CurrencyIdSchema = z.string().min(1).brand<"CurrencyId">();

/** Opaque identifier for a token (e.g. `"ethereum/erc20/usd-tether"`). Non-empty string. */
export const TokenIdSchema = z.string().min(1).brand<"TokenId">();

/**
 * Arbitrary-precision decimal number encoded as a string.
 * Use this for on-chain amounts to avoid IEEE 754 precision loss.
 * Parse with a BigNumber library after validation.
 */
export const BigNumberStrSchema = z
  .string()
  .regex(/^-?\d+(\.\d+)?$/, "Expected a decimal-encoded number")
  .brand<"BigNumberStr">();

/** A string guaranteed to be non-empty after trimming leading/trailing whitespace. */
export const NonEmptyStringSchema = z.string().trim().min(1).brand<"NonEmptyString">();

/**
 * RFC 3339 datetime string with a mandatory UTC offset.
 * Compatible with both `new Date()` and `Temporal.Instant.from()`.
 * Bracket annotations (e.g. `[Asia/Kolkata]`) are intentionally excluded to
 * preserve `Date` compatibility — use `Temporal.ZonedDateTime` strings if you
 * need named-timezone annotations.
 *
 * @example `"2024-01-31T12:00:00Z"`, `"2024-01-31T12:00:00+05:30"`, `"2024-01-31T12:00:00.123Z"`
 */
export const DateTimeIsoSchema = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/,
    "Expected an RFC 3339 datetime string (e.g. 2024-01-31T12:00:00Z)",
  )
  .brand<"DateTimeIso">();

/** Absolute `http://` or `https://` URL. */
export const HttpUrlSchema = z
  .url("Expected a valid URL")
  .refine(
    val => val.startsWith("http://") || val.startsWith("https://"),
    "Expected an http or https URL",
  )
  .brand<"HttpUrl">();

/** Semantic version string (`MAJOR.MINOR.PATCH[-prerelease][+build]`). */
export const SemVerSchema = z
  .string()
  .regex(/^\d+\.\d+\.\d+(?:-[\w.]+)?(?:\+[\w.]+)?$/, "Expected a semver string (e.g. 1.2.3)")
  .brand<"SemVer">();

export type CurrencyId = z.infer<typeof CurrencyIdSchema>;
export type TokenId = z.infer<typeof TokenIdSchema>;
export type BigNumberStr = z.infer<typeof BigNumberStrSchema>;
export type NonEmptyString = z.infer<typeof NonEmptyStringSchema>;
export type DateTimeIso = z.infer<typeof DateTimeIsoSchema>;
export type HttpUrl = z.infer<typeof HttpUrlSchema>;
export type SemVer = z.infer<typeof SemVerSchema>;
