import { safeParseAnyAccountId, type AnyAccountId } from "@domain/entity-account";
import type { AccountAliasState } from "./schema";

/** Account id behind an alias, `undefined` when the alias was never registered. */
export const accountIdFromAliasSelector = (
  state: AccountAliasState,
  alias: string,
): AnyAccountId | undefined => state.accountIdByAlias[alias];

/**
 * Account id behind a route segment, falling back to the segment when it is already a well-formed
 * id so legacy deeplinks keep working. `undefined` when it is neither.
 */
export const resolveAccountIdSelector = (
  state: AccountAliasState,
  segment: string,
): AnyAccountId | undefined => state.accountIdByAlias[segment] ?? safeParseAnyAccountId(segment);
