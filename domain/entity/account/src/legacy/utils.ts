import {
  AnyAccountIdSchema,
  TokenAccountIdSchema,
  type AccountId,
  type AnyAccountId,
  type TokenAccountId,
} from "./schema";

/** Parses a raw string into an `AnyAccountId`. */
export function parseAnyAccountId(raw: string): AnyAccountId {
  return AnyAccountIdSchema.parse(raw);
}

/** The same, returning `undefined` instead of throwing. */
export function safeParseAnyAccountId(raw: string): AnyAccountId | undefined {
  const result = AnyAccountIdSchema.safeParse(raw);
  return result.success ? result.data : undefined;
}

/** Builds a token-account id: `<parentId>+<encodedTokenId>`. The parent must be a plain `AccountId`. */
export function encodeTokenAccountId(parentId: AccountId, encodedTokenId: string): TokenAccountId {
  return TokenAccountIdSchema.parse(`${parentId}+${encodedTokenId}`);
}

/**
 * Extracts the parent `AccountId` from a `TokenAccountId`.
 *
 * Cast rather than parsed: `TokenAccountId`'s invariant is exactly `AccountId`'s for the part before
 * the `+` — non-empty and `+`-free — so a parse here would re-validate what the argument's type
 * already guarantees.
 */
export function getParentId(id: TokenAccountId): AccountId {
  return id.split("+")[0] as AccountId;
}
