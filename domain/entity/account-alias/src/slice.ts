import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import {
  parseAnyAccountId,
  safeParseAnyAccountId,
  type AnyAccountId,
} from "@domain/entity-account";
import { computeAccountAlias, initialAccountAliasState, type AccountAliasState } from "./schema";

export const accountAliasSlice = createSlice({
  name: "accountAlias",
  initialState: initialAccountAliasState,
  reducers: {
    /** Makes the given account ids resolvable from their alias. Idempotent. */
    registerAccountAliases: (state, { payload }: PayloadAction<string[]>) => {
      for (const raw of payload) {
        const accountId = parseAnyAccountId(raw);
        const alias = computeAccountAlias(accountId);
        if (state.accountIdByAlias[alias] !== accountId) {
          state.accountIdByAlias[alias] = accountId;
        }
      }
    },
  },
  selectors: {
    /** Account id behind an alias, `undefined` when the alias was never registered. */
    accountIdFromAliasSelector: (
      state: AccountAliasState,
      alias: string,
    ): AnyAccountId | undefined => state.accountIdByAlias[alias],

    /**
     * Account id behind a route segment, falling back to the segment when it is already a well-formed
     * id so legacy deeplinks keep working. `undefined` when it is neither.
     */
    resolveAccountIdSelector: (
      state: AccountAliasState,
      segment: string,
    ): AnyAccountId | undefined =>
      state.accountIdByAlias[segment] ?? safeParseAnyAccountId(segment),
  },
});

export const { registerAccountAliases } = accountAliasSlice.actions;

// Bound to the slice state itself: the desktop app mounts this slice at `accountAliases`.
export const { accountIdFromAliasSelector, resolveAccountIdSelector } =
  accountAliasSlice.getSelectors();
