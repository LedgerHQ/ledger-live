import type { Action, ReducerMap } from "redux-actions";
import { handleActions } from "redux-actions";
import { createSelector } from "~/context/selectors";
import {
  BorrowActionTypes,
  BorrowPayload,
  BorrowSetInfoBottomSheetPayload,
} from "../actions/types";
import type { BorrowState, State } from "./types";

export const INITIAL_STATE: BorrowState = {
  infoBottomSheet: undefined,
};

const handlers: ReducerMap<BorrowState, BorrowPayload> = {
  [BorrowActionTypes.BORROW_INFO_BOTTOM_SHEET]: (state, action): BorrowState => ({
    ...state,
    infoBottomSheet: (action as Action<BorrowSetInfoBottomSheetPayload>).payload,
  }),
};

const storeSelector = (state: State): BorrowState => state.borrow;

export const exportSelector = storeSelector;

export const borrowInfoBottomSheetSelector = createSelector(
  storeSelector,
  (state: BorrowState) => state.infoBottomSheet,
);

export default handleActions<BorrowState, BorrowPayload>(handlers, INITIAL_STATE);
