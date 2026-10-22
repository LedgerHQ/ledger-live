// Lightweight module-level store for the action menu dialog, kept apart from
// CustomHandlers so that the dialog can import it without the heavy PTX graph.

import type {
  ActionMenuDialogParams,
  ActionMenuDialogResult,
} from "@ledgerhq/live-common/wallet-api/validation/actionMenuDialogParams";
import { sanitizeActionMenuDialogParams } from "@ledgerhq/live-common/wallet-api/validation/actionMenuDialogParams";
import { setActionMenuDialog } from "~/renderer/reducers/actionMenuDialog";
import type { Dispatch } from "redux";

type ActionMenuDialogResolver = (result: ActionMenuDialogResult) => void;

let pendingResolver: ActionMenuDialogResolver | null = null;
let menuDialogDispatch: Dispatch | null = null;

export function resolveActionMenuDialog(selectedOptionId: string | null) {
  const resolver = pendingResolver;
  pendingResolver = null;
  if (menuDialogDispatch) {
    menuDialogDispatch(setActionMenuDialog(null));
    menuDialogDispatch = null;
  }
  if (resolver) resolver({ selectedOptionId });
}

export function createOpenActionMenuDialogHandler(dispatch: Dispatch) {
  return async (request: { params?: ActionMenuDialogParams }): Promise<ActionMenuDialogResult> => {
    const validated = sanitizeActionMenuDialogParams(request.params, "custom.dialog.menu");

    // If a previous menu is still pending, resolve it as dismissed before opening the new one.
    if (pendingResolver) {
      pendingResolver({ selectedOptionId: null });
      pendingResolver = null;
    }

    return new Promise<ActionMenuDialogResult>(resolve => {
      pendingResolver = resolve;
      menuDialogDispatch = dispatch;
      dispatch(setActionMenuDialog(validated));
    });
  };
}
