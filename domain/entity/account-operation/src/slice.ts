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
      const entry = state[accountUUID] ?? {
        byId: {},
        windows: {},
        countervalues: {},
        revisionById: {},
      };
      const window = append ? [...(entry.windows[queryKey] ?? [])] : [];
      const windowCountervalues = append ? { ...entry.countervalues[queryKey] } : {};
      const known = new Set(window);
      for (const { countervalues, ...row } of data.operations) {
        const storedRevision = entry.revisionById[row.id];
        // An older answer of another query lists the row, but never overwrites a newer one.
        if (storedRevision === undefined || storedRevision <= revision) {
          entry.byId[row.id] = row;
          entry.revisionById[row.id] = revision;
        }
        if (countervalues) windowCountervalues[row.id] = countervalues;
        if (known.has(row.id)) continue;
        known.add(row.id);
        window.push(row.id);
      }
      entry.windows[queryKey] = window;
      if (Object.keys(windowCountervalues).length > 0) {
        entry.countervalues[queryKey] = windowCountervalues;
      } else {
        delete entry.countervalues[queryKey];
      }
      // A head read replaces its window: rows no window lists any more go with it.
      if (!append) dropUnlisted(entry);
      state[accountUUID] = entry;
    });
  },
});

export default accountOperationsSlice.reducer;
