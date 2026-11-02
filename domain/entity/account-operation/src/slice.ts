import { createSlice } from "@reduxjs/toolkit";
import { isAccountDataReceived } from "@domain/entity-account-data";
import { initialAccountOperationsState, type AccountOperationsEntry } from "./schema";

const dropUnlisted = ({ byId, windows, revisionById }: AccountOperationsEntry) => {
  const listed = new Set(Object.values(windows).flatMap(window => window ?? []));
  for (const row of Object.values(byId)) {
    if (row && !listed.has(row.id)) {
      delete byId[row.id];
      delete revisionById[row.id];
    }
  }
};

export const accountOperationsSlice = createSlice({
  name: "accountOperations",
  initialState: initialAccountOperationsState,
  reducers: {},
  extraReducers: builder => {
    builder.addMatcher(isAccountDataReceived("operations"), (state, { payload }) => {
      const { accountUUID, queryKey, data, append, revision } = payload;
      const entry = state[accountUUID] ?? { byId: {}, windows: {}, revisionById: {} };
      const window = append ? [...(entry.windows[queryKey] ?? [])] : [];
      const known = new Set(window);
      for (const operation of data.operations) {
        const storedRevision = entry.revisionById[operation.id];
        // An older answer of another query lists the row, but never overwrites a newer one.
        if (storedRevision === undefined || storedRevision <= revision) {
          entry.byId[operation.id] = operation;
          entry.revisionById[operation.id] = revision;
        }
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
