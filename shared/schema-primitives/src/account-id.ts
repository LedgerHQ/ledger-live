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

/** `AccountId` or `TokenAccountId` — use when the account type doesn't matter. */
export type AnyAccountId = AccountId | TokenAccountId;

/** Parses a raw string into an `AnyAccountId`, discriminating on the presence of `+`. */
export function parseAnyAccountId(raw: string): AnyAccountId {
  return raw.includes("+") ? TokenAccountIdSchema.parse(raw) : AccountIdSchema.parse(raw);
}

/** Builds a token-account id: `<parentId>+<encodedTokenId>`. The parent must be a plain `AccountId`. */
export function encodeTokenAccountId(parentId: AccountId, encodedTokenId: string): TokenAccountId {
  if (!encodedTokenId || encodedTokenId.includes("+")) {
    throw new Error("encodedTokenId must be non-empty and must not contain '+'");
  }
  return TokenAccountIdSchema.parse(`${parentId as string}+${encodedTokenId}`);
}

/** Extracts the parent `AccountId` from a `TokenAccountId`. */
export function getParentId(id: TokenAccountId): AccountId {
  const plusIdx = (id as string).indexOf("+");
  return AccountIdSchema.parse((id as string).slice(0, plusIdx));
}
