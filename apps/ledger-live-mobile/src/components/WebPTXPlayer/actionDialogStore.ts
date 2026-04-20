// Lightweight module-level store for the action dialog.
// Extracted from CustomHandlers so that consumers (e.g. ActionConfirmationDialog)
// can import without pulling in the heavy PTX dependency graph.

import type { ActionDialogParams } from "@ledgerhq/live-common/wallet-api/validation/actionDialogParams";
import { sanitizeActionDialogParams } from "@ledgerhq/live-common/wallet-api/validation/actionDialogParams";
import { makeSetEarnActionDialogAction } from "~/actions/earn";
import type { Dispatch } from "redux";

type ActionDialogResolver = (result: { confirmed: boolean }) => void;

let pendingActionDialogResolver: ActionDialogResolver | null = null;
let actionDialogDispatch: Dispatch | null = null;

export function resolveActionDialog(confirmed: boolean) {
  const resolver = pendingActionDialogResolver;
  pendingActionDialogResolver = null;
  if (actionDialogDispatch) {
    actionDialogDispatch(makeSetEarnActionDialogAction(undefined));
    actionDialogDispatch = null;
  }
  if (resolver) resolver({ confirmed });
}

export function createOpenActionDialogHandler(dispatch: Dispatch) {
  return async (request: {
    params?: ActionDialogParams;
  }): Promise<{ confirmed: boolean }> => {
    const validated = sanitizeActionDialogParams(request.params, "custom.dialog.confirmation");

    // If a previous dialog is still pending, resolve it as dismissed before opening the new one.
    if (pendingActionDialogResolver) {
      pendingActionDialogResolver({ confirmed: false });
      pendingActionDialogResolver = null;
    }

    return new Promise<{ confirmed: boolean }>(resolve => {
      pendingActionDialogResolver = resolve;
      actionDialogDispatch = dispatch;
      dispatch(makeSetEarnActionDialogAction(validated));
    });
  };
}
