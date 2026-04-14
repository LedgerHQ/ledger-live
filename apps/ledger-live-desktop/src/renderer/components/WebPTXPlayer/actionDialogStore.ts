// Lightweight module-level store for the action dialog.
// Extracted from CustomHandlers so that consumers (e.g. ActionConfirmationDialog)
// can subscribe without pulling in the heavy PTX dependency graph.

import type { ActionDialogParams } from "@ledgerhq/live-common/wallet-api/validation/actionDialogParams";

export type ActionDialogData = ActionDialogParams;

type ActionDialogResolver = (result: { confirmed: boolean }) => void;

let actionDialogState: ActionDialogData | null = null;
let pendingActionDialogResolver: ActionDialogResolver | null = null;
const actionDialogListeners = new Set<() => void>();

function notifyActionDialogListeners() {
  actionDialogListeners.forEach(l => l());
}

export function getActionDialogSnapshot(): ActionDialogData | null {
  return actionDialogState;
}

export function subscribeActionDialog(listener: () => void): () => void {
  actionDialogListeners.add(listener);
  return () => actionDialogListeners.delete(listener);
}

export function resolveActionDialog(confirmed: boolean) {
  const resolver = pendingActionDialogResolver;
  pendingActionDialogResolver = null;
  actionDialogState = null;
  notifyActionDialogListeners();
  if (resolver) resolver({ confirmed });
}

export function showActionDialog(params: ActionDialogData): Promise<{ confirmed: boolean }> {
  if (pendingActionDialogResolver) {
    pendingActionDialogResolver({ confirmed: false });
    pendingActionDialogResolver = null;
  }

  return new Promise<{ confirmed: boolean }>(resolve => {
    pendingActionDialogResolver = resolve;
    actionDialogState = params;
    notifyActionDialogListeners();
  });
}
