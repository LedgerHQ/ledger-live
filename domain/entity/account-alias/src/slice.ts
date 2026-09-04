import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { parseAnyAccountId } from "@shared/schema-primitives";
import { computeAccountAlias, initialAccountAliasState } from "./schema";

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
});

export const { registerAccountAliases } = accountAliasSlice.actions;
