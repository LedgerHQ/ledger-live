/**
 * Module-level resolver store and handler factory for the Borrow
 * `custom.bottomSheet.error` wallet-api method.
 *
 * The handler returns a Promise that the live app awaits. The promise always
 * resolves with `{ confirmed: boolean }`:
 *   - `{ confirmed: true }` when the CTA button is pressed (onSuccess).
 *   - `{ confirmed: false }` when the sheet is closed or dragged down (onError).
 *
 * Mirrors the `actionDialogStore` pattern used by the Earn live app.
 */

import { sanitizeBorrowErrorBottomSheetParams } from "@ledgerhq/live-common/wallet-api/Borrow/errorBottomSheetParams";
import type { BorrowErrorBottomSheetParams } from "@ledgerhq/live-common/wallet-api/Borrow/errorBottomSheetParams";
import { setErrorBottomSheet } from "~/reducers/borrow";
import type { Dispatch } from "redux";

const HANDLER_NAME = "custom.bottomSheet.error";

type BorrowErrorBottomSheetResolver = (result: { confirmed: boolean }) => void;

let pendingResolver: BorrowErrorBottomSheetResolver | null = null;
let errorBottomSheetDispatch: Dispatch | null = null;

/**
 * Settle the pending error bottom sheet.
 *
 * @param confirmed `true` when the CTA was pressed, `false` when the sheet was
 * dismissed (close button or drag-down).
 */
export function resolveBorrowErrorBottomSheet(confirmed: boolean) {
  const resolver = pendingResolver;
  pendingResolver = null;
  if (errorBottomSheetDispatch) {
    errorBottomSheetDispatch(setErrorBottomSheet(undefined));
    errorBottomSheetDispatch = null;
  }
  if (resolver) resolver({ confirmed });
}

export function createOpenBorrowErrorBottomSheetHandler(dispatch: Dispatch) {
  return async (request: {
    params?: BorrowErrorBottomSheetParams;
  }): Promise<{ confirmed: boolean }> => {
    const validated = sanitizeBorrowErrorBottomSheetParams(request.params, HANDLER_NAME);

    // If a previous sheet is still pending, resolve it as dismissed before opening the new one.
    if (pendingResolver) {
      pendingResolver({ confirmed: false });
      pendingResolver = null;
    }

    return new Promise<{ confirmed: boolean }>(resolve => {
      pendingResolver = resolve;
      errorBottomSheetDispatch = dispatch;
      dispatch(setErrorBottomSheet(validated));
    });
  };
}
