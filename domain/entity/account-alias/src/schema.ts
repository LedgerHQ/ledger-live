import { z } from "zod";
import { v5 as uuidv5 } from "uuid";
import { type AnyAccountId, parseAnyAccountId } from "@shared/schema-primitives";

/**
 * Namespace for account id aliasing. Randomly generated uuid v4, distinct from the wallet-api one
 * so the same account cannot be correlated across the two surfaces. It is a build-time constant,
 * not a secret — see the reversibility note on `computeAccountAlias`.
 */
const ACCOUNT_ALIAS_NAMESPACE = "6f2f9d3a-0f5d-4d51-9b5b-2f0f2a2f1c73";

/** Opaque, deterministic stand-in for an account id. */
export const AccountAliasSchema = z.uuid().brand<"AccountAlias">();

export type AccountAlias = z.infer<typeof AccountAliasSchema>;

const aliasByAccountId = new Map<AnyAccountId, AccountAlias>();

/**
 * Derives the alias of an account id. Deterministic across sessions and devices, so an alias can
 * safely be put in a route, and one-way, so it carries neither xpub nor address.
 *
 * It is not a secret. The namespace ships in the binary, so anyone already holding a candidate
 * address or xpub can confirm a match by recomputing the alias, and the same wallet yields the
 * same alias on every install. This stops the plaintext leak; it is not an unlinkability
 * guarantee. Same trade-off as the wallet-api aliasing this generalizes.
 */
export function computeAccountAlias(accountId: AnyAccountId): AccountAlias {
  const cached = aliasByAccountId.get(accountId);
  if (cached) return cached;
  const alias = AccountAliasSchema.parse(uuidv5(accountId, ACCOUNT_ALIAS_NAMESPACE));
  aliasByAccountId.set(accountId, alias);
  return alias;
}

export const AccountAliasStateSchema = z.object({
  /** Reverse map keyed by alias, only known for accounts registered during this session. */
  accountIdByAlias: z.record(z.string(), z.string().transform(parseAnyAccountId)),
});

export type AccountAliasState = z.infer<typeof AccountAliasStateSchema>;

export const initialAccountAliasState: AccountAliasState = { accountIdByAlias: {} };
