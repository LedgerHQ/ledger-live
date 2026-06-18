import { validateInfoDialogParams } from "@ledgerhq/live-common/wallet-api/validation/validateInfoDialogParams";
import type { InfoDialogParams } from "@ledgerhq/live-common/wallet-api/validation/validateInfoDialogParams";
import type { Dispatch } from "redux";
import { setInfoBottomSheet } from "~/reducers/borrow";

export function createOpenBorrowInfoBottomSheetHandler(dispatch: Dispatch) {
  return async (request: { params?: InfoDialogParams }) => {
    const validated = validateInfoDialogParams(request.params, "custom.bottomSheet.info");
    dispatch(setInfoBottomSheet(validated));
  };
}
