import { useCallback, useEffect, useRef, useState } from "react";
import {
  resolveEditUiStateOnConnectDifferentDevice,
  resolveEditUiStateOnSignerMismatch,
  resolveEditUiStateOnSignerMismatchCancel,
  type SignerEditUiState,
} from "./model/signerEditUiState";

export type UseContactEditSignerUiStateResult = Readonly<{
  editUiState: SignerEditUiState;
  isEditSessionActive: boolean;
  openEditDialog: () => void;
  requestSignerApproval: () => Promise<boolean>;
  grantSignerApproval: () => void;
  openSignerMismatchDialog: () => void;
  onSignerCancel: () => void;
  onSignerMismatchCancel: () => void;
  onConnectDifferentDevice: () => void;
  onEditClose: () => void;
  resetEditUiState: () => void;
}>;

export function useContactEditSignerUiState(): UseContactEditSignerUiStateResult {
  const [editUiState, setEditUiState] = useState<SignerEditUiState>("closed");
  const editUiStateRef = useRef<SignerEditUiState>("closed");
  const pendingApprovalRef = useRef<((approved: boolean) => void) | undefined>(undefined);

  const transitionEditUiState = useCallback((next: SignerEditUiState) => {
    editUiStateRef.current = next;
    setEditUiState(next);
  }, []);

  const settleSignerApproval = useCallback((approved: boolean) => {
    const resolvePendingApproval = pendingApprovalRef.current;
    pendingApprovalRef.current = undefined;
    resolvePendingApproval?.(approved);
  }, []);

  const openEditDialog = useCallback(() => {
    transitionEditUiState("edit-open");
  }, [transitionEditUiState]);

  const requestSignerApproval = useCallback(
    () =>
      new Promise<boolean>(resolve => {
        settleSignerApproval(false);
        pendingApprovalRef.current = resolve;
        transitionEditUiState("signer-open");
      }),
    [settleSignerApproval, transitionEditUiState],
  );

  const grantSignerApproval = useCallback(() => {
    transitionEditUiState("edit-open");
    settleSignerApproval(true);
  }, [settleSignerApproval, transitionEditUiState]);

  const openSignerMismatchDialog = useCallback(() => {
    transitionEditUiState(resolveEditUiStateOnSignerMismatch());
  }, [transitionEditUiState]);

  const onSignerCancel = useCallback(() => {
    if (editUiStateRef.current !== "signer-open") {
      return;
    }

    transitionEditUiState("edit-open");
    settleSignerApproval(false);
  }, [settleSignerApproval, transitionEditUiState]);

  const onSignerMismatchCancel = useCallback(() => {
    if (editUiStateRef.current !== "signer-mismatch") {
      return;
    }

    transitionEditUiState(resolveEditUiStateOnSignerMismatchCancel());
    settleSignerApproval(false);
  }, [settleSignerApproval, transitionEditUiState]);

  const onConnectDifferentDevice = useCallback(() => {
    transitionEditUiState(resolveEditUiStateOnConnectDifferentDevice());
  }, [transitionEditUiState]);

  const onEditClose = useCallback(() => {
    if (editUiStateRef.current !== "edit-open") {
      return;
    }

    transitionEditUiState("closed");
    settleSignerApproval(false);
  }, [settleSignerApproval, transitionEditUiState]);

  const resetEditUiState = useCallback(() => {
    transitionEditUiState("closed");
    settleSignerApproval(false);
  }, [settleSignerApproval, transitionEditUiState]);

  useEffect(() => () => settleSignerApproval(false), [settleSignerApproval]);

  return {
    editUiState,
    isEditSessionActive: editUiState !== "closed",
    openEditDialog,
    requestSignerApproval,
    grantSignerApproval,
    openSignerMismatchDialog,
    onSignerCancel,
    onSignerMismatchCancel,
    onConnectDifferentDevice,
    onEditClose,
    resetEditUiState,
  };
}
