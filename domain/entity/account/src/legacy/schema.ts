import { z } from "zod";

/** Opaque id for a top-level account. Non-empty string that must not contain `+`. */
export const AccountIdSchema = z
  .string()
  .min(1)
  .refine(s => !s.includes("+"), "AccountId must not contain '+'")
  .brand<"AccountId">();
export type AccountId = z.infer<typeof AccountIdSchema>;

/** Opaque id for a token-account. Format: `<parentAccountId>+<encodedTokenId>` with exactly one `+`. */
export const TokenAccountIdSchema = z
  .string()
  .refine(s => {
    const i = s.indexOf("+");
    return i > 0 && i === s.lastIndexOf("+") && i < s.length - 1;
  }, "TokenAccountId must contain exactly one '+' with non-empty parts on both sides")
  .brand<"TokenAccountId">();
export type TokenAccountId = z.infer<typeof TokenAccountIdSchema>;

/**
 * Either kind of account id — for a field or a record key that legitimately holds both, a table with
 * main accounts and token accounts as sibling rows being the obvious case.
 *
 * A union rather than a third brand: the two ids stay distinguishable after parsing, so a consumer
 * that does care can still narrow, and one that does not is spared a cast. The members are mutually
 * exclusive by construction — `AccountId` forbids the `+` that `TokenAccountId` requires — so the
 * union never has to disambiguate and its order is irrelevant.
 */
export const AnyAccountIdSchema = z.union([AccountIdSchema, TokenAccountIdSchema]);
export type AnyAccountId = z.infer<typeof AnyAccountIdSchema>;
