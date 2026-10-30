import { createSlice } from "@reduxjs/toolkit";
import { isAccountDataReceived } from "@domain/entity-account-data";
import {
  initialAccountOperationsState,
  type AccountOperation,
  type AccountOperationsEntry,
} from "./schema";

/** A row read again keeps the countervalues other queries asked for. */
const merge = (stored: AccountOperation | undefined, read: AccountOperation): AccountOperation =>
  stored?.countervalues
    ? { ...read, countervalues: { ...stored.countervalues, ...read.countervalues } }
    : read;

const dropUnlisted = ({ byId, windows }: AccountOperationsEntry) => {
  const listed = new Set(Object.values(windows).flatMap(window => window ?? []));
  for (const row of Object.values(byId)) if (row && !listed.has(row.id)) delete byId[row.id];
};

export const accountOperationsSlice = createSlice({
  name: "accountOperations",
  initialState: initialAccountOperationsState,
  reducers: {},
  extraReducers: builder => {
    builder.addMatcher(isAccountDataReceived("operations"), (state, { payload }) => {
      const { accountUUID, queryKey, data, append } = payload;
      const entry = state[accountUUID] ?? { byId: {}, windows: {} };
      const window = append ? [...(entry.windows[queryKey] ?? [])] : [];
      const known = new Set(window);
      for (const operation of data.operations) {
        entry.byId[operation.id] = merge(entry.byId[operation.id], operation);
        if (known.has(operation.id)) continue;
        known.add(operation.id);
        window.push(operation.id);
      }
      entry.windows[queryKey] = window;
      // A head read replaces its window: rows no window lists any more go with it.
      if (!append) dropUnlisted(entry);
      state[accountUUID] = entry;
    });
  },
});

export default accountOperationsSlice.reducer;
