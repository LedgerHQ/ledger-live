import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { OperationHistoryState, StoredOperation } from "./schema";
import { loadAccountData } from "../../shared/accountDataActions";
import { loadOperationHistory } from "./actions";
import type { OperationHistoryUpdatesPayload } from "./actions";

const initialState: OperationHistoryState = {
  byAccountId: {},
};

function applyUpdatesPayload(
  state: OperationHistoryState,
  updates: OperationHistoryUpdatesPayload,
): void {
  if (updates.mode === "replace") {
    state.byAccountId[updates.mainAccountId] = {
      operations: updates.operations,
      nextPagingToken: updates.nextPagingToken,
    };
    for (const ta of updates.tokenAccountUpdates) {
      state.byAccountId[ta.accountId] = {
        operations: ta.operations,
      };
    }
  } else {
    const entry = state.byAccountId[updates.accountId];
    if (!entry) return;
    const existingIds = new Set(entry.operations.map(o => o.id));
    const newOps = updates.operations.filter(op => !existingIds.has(op.id));
    entry.operations = entry.operations.concat(newOps);
    if (updates.nextPagingToken !== undefined) {
      entry.nextPagingToken = updates.nextPagingToken;
    }
  }
}

export const operationHistorySlice = createSlice({
  name: "v4OperationHistory",
  initialState,
  reducers: {
    setOperationHistoryForAccount(
      state,
      action: PayloadAction<{
        accountId: string;
        operations: StoredOperation[];
        nextPagingToken?: string;
      }>,
    ) {
      state.byAccountId[action.payload.accountId] = {
        operations: action.payload.operations,
        nextPagingToken: action.payload.nextPagingToken,
      };
    },
    /** Append operations (e.g. "load more" page). Dedupes by op.id so we never duplicate if API returns same page. */
    appendOperationsForAccount(
      state,
      action: PayloadAction<{
        accountId: string;
        operations: StoredOperation[];
        nextPagingToken?: string;
      }>,
    ) {
      const entry = state.byAccountId[action.payload.accountId];
      if (!entry) return;
      const existingIds = new Set(entry.operations.map(o => o.id));
      const newOps = action.payload.operations.filter(op => !existingIds.has(op.id));
      entry.operations = entry.operations.concat(newOps);
      if (action.payload.nextPagingToken !== undefined) {
        entry.nextPagingToken = action.payload.nextPagingToken;
      }
    },
    clearOperationHistoryForAccount(state, action: PayloadAction<string>) {
      delete state.byAccountId[action.payload];
    },
  },
  extraReducers: builder => {
    builder.addCase(loadAccountData.fulfilled, (state, action) => {
      const { accountV4, operations, tokenAccountOperations } = action.payload;
      state.byAccountId[accountV4.id] = { operations };
      for (const ta of tokenAccountOperations) {
        state.byAccountId[ta.accountId] = { operations: ta.operations };
      }
    });
    builder.addCase(loadOperationHistory.fulfilled, (state, action) => {
      if (action.payload?.updates) {
        applyUpdatesPayload(state, action.payload.updates);
      }
    });
  },
});

export const {
  setOperationHistoryForAccount,
  appendOperationsForAccount,
  clearOperationHistoryForAccount,
} = operationHistorySlice.actions;
export const operationHistoryReducer = operationHistorySlice.reducer;
