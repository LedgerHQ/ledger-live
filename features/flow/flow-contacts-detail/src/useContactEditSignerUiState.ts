import { useCallback, useRef, useState } from "react";
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
  openSignerMismatchDialog: () => void;
  onSignerMismatchCancel: () => void;
  onConnectDifferentDevice: () => void;
  onEditClose: () => void;
  resetEditUiState: () => void;
}>;

export function useContactEditSignerUiState(): UseContactEditSignerUiStateResult {
  const [editUiState, setEditUiState] = useState<SignerEditUiState>("closed");
  const editUiStateRef = useRef<SignerEditUiState>("closed");

  const transitionEditUiState = useCallback((next: SignerEditUiState) => {
    editUiStateRef.current = next;
    setEditUiState(next);
  }, []);

  const openEditDialog = useCallback(() => {
    transitionEditUiState("edit-open");
  }, [transitionEditUiState]);

  const openSignerMismatchDialog = useCallback(() => {
    transitionEditUiState(resolveEditUiStateOnSignerMismatch());
  }, [transitionEditUiState]);

  const onSignerMismatchCancel = useCallback(() => {
    if (editUiStateRef.current !== "signer-mismatch") {
      return;
    }

    transitionEditUiState(resolveEditUiStateOnSignerMismatchCancel());
  }, [transitionEditUiState]);

  const onConnectDifferentDevice = useCallback(() => {
    transitionEditUiState(resolveEditUiStateOnConnectDifferentDevice());
  }, [transitionEditUiState]);

  const onEditClose = useCallback(() => {
    if (editUiStateRef.current !== "edit-open") {
      return;
    }

    transitionEditUiState("closed");
  }, [transitionEditUiState]);

  const resetEditUiState = useCallback(() => {
    transitionEditUiState("closed");
  }, [transitionEditUiState]);

  return {
    editUiState,
    isEditSessionActive: editUiState !== "closed",
    openEditDialog,
    openSignerMismatchDialog,
    onSignerMismatchCancel,
    onConnectDifferentDevice,
    onEditClose,
    resetEditUiState,
  };
}
