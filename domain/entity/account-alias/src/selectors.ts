import { type AnyAccountId, parseAnyAccountId } from "@shared/schema-primitives";
import type { AccountAliasState } from "./schema";

/** Account id behind an alias, `undefined` when the alias was never registered. */
export const accountIdFromAliasSelector = (
  state: AccountAliasState,
  alias: string,
): AnyAccountId | undefined => state.accountIdByAlias[alias];

/**
 * Account id behind a route segment. Falls back to the segment itself so links holding a raw
 * account id — legacy deeplinks, persisted navigation state — keep working.
 */
export const resolveAccountIdSelector = (state: AccountAliasState, segment: string): AnyAccountId =>
  state.accountIdByAlias[segment] ?? parseAnyAccountId(segment);
