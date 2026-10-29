import { createSlice } from "@reduxjs/toolkit";
import { isAccountDataReceived } from "@domain/entity-account-data";
import { initialAccountOperationsState } from "./schema";

export const accountOperationsSlice = createSlice({
  name: "accountOperations",
  initialState: initialAccountOperationsState,
  reducers: {},
  extraReducers: builder => {
    builder.addMatcher(isAccountDataReceived("operations"), (state, { payload }) => {
      const { accountUUID, data, append } = payload;
      const stored = append ? (state[accountUUID] ?? []) : [];
      const known = new Set(stored.map(operation => operation.id));
      state[accountUUID] = [
        ...stored,
        ...data.operations.filter(operation => !known.has(operation.id)),
      ];
    });
  },
});
