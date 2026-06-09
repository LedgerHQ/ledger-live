import { createAction } from "redux-actions";
import { BorrowActionTypes } from "./types";
import type { BorrowSetInfoBottomSheetPayload } from "./types";

export const makeSetBorrowInfoBottomSheetAction = createAction<BorrowSetInfoBottomSheetPayload>(
  BorrowActionTypes.BORROW_INFO_BOTTOM_SHEET,
);
