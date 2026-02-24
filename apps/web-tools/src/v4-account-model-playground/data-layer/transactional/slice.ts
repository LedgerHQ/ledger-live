/**
 * Transactional slice – pending operations + prepare/validate/broadcast state.
 * pendingOperationsByAccountId is the source of truth; operationHistory holds only confirmed ops.
 */
import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { StoredOperation } from "../operationHistory/schema";
import type { TransactionalState } from "./schema";
import { loadAccountData } from "../../shared/accountDataActions";
import { loadOperationHistory } from "../operationHistory/actions";

const initialState: TransactionalState = {
  pendingOperationsByAccountId: {},
};

export const transactionalSlice = createSlice({
  name: "v4Transactional",
  initialState,
  reducers: {
    setPendingOperationsForAccount(
      state,
      action: PayloadAction<{ accountId: string; pendingOperations: StoredOperation[] }>,
    ) {
      const { accountId, pendingOperations } = action.payload;
      if (pendingOperations.length === 0) {
        delete state.pendingOperationsByAccountId[accountId];
      } else {
        state.pendingOperationsByAccountId[accountId] = pendingOperations;
      }
    },
    addPendingOperationForAccount(
      state,
      action: PayloadAction<{ accountId: string; operation: StoredOperation }>,
    ) {
      const { accountId, operation } = action.payload;
      const list = state.pendingOperationsByAccountId[accountId] ?? [];
      if (list.some(op => op.id === operation.id)) return;
      state.pendingOperationsByAccountId[accountId] = [...list, operation];
    },
  },
  extraReducers: builder => {
    builder.addCase(loadAccountData.fulfilled, (state, action) => {
      const { accountV4, pendingOperations, tokenAccountOperations } = action.payload;
      if (pendingOperations.length > 0) {
        state.pendingOperationsByAccountId[accountV4.id] = pendingOperations;
      }
      for (const ta of tokenAccountOperations) {
        if (ta.pendingOperations.length > 0) {
          state.pendingOperationsByAccountId[ta.accountId] = ta.pendingOperations;
        }
      }
    });
    builder.addCase(loadOperationHistory.fulfilled, (state, action) => {
      const updates = action.payload?.updates;
      if (!updates || updates.mode !== "replace") return;
      if (updates.pendingOperations.length > 0) {
        state.pendingOperationsByAccountId[updates.mainAccountId] = updates.pendingOperations;
      }
      for (const ta of updates.tokenAccountUpdates) {
        if (ta.pendingOperations.length > 0) {
          state.pendingOperationsByAccountId[ta.accountId] = ta.pendingOperations;
        }
      }
    });
  },
});

export const { setPendingOperationsForAccount, addPendingOperationForAccount } =
  transactionalSlice.actions;
export const transactionalReducer = transactionalSlice.reducer;
