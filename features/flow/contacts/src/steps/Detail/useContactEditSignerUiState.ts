import { useCallback, useState } from "react";
import {
  resolveEditUiStateOnConnectDifferentDevice,
  resolveEditUiStateOnSignerMismatch,
  resolveEditUiStateOnSignerMismatchCancel,
  type SignerEditUiState,
} from "./model/signerEditUiState";

export type UseContactEditSignerUiStateResult = Readonly<{
  editUiState: SignerEditUiState;
  openSignerDialog: () => void;
  openSignerMismatchDialog: () => void;
  openEditDialog: () => void;
  onSignerConfirm: () => void;
  onSignerCancel: () => void;
  onSignerMismatchCancel: () => void;
  onConnectDifferentDevice: () => void;
  onEditClose: () => void;
  resetEditUiState: () => void;
}>;

export function useContactEditSignerUiState(): UseContactEditSignerUiStateResult {
  const [editUiState, setEditUiState] = useState<SignerEditUiState>("closed");

  const openSignerDialog = useCallback(() => {
    setEditUiState("signer-open");
  }, []);

  const openSignerMismatchDialog = useCallback(() => {
    setEditUiState(resolveEditUiStateOnSignerMismatch());
  }, []);

  const openEditDialog = useCallback(() => {
    setEditUiState("edit-open");
  }, []);

  const onSignerConfirm = useCallback(() => {
    setEditUiState("edit-open");
  }, []);

  const onSignerMismatchCancel = useCallback(() => {
    setEditUiState(resolveEditUiStateOnSignerMismatchCancel());
  }, []);

  const onConnectDifferentDevice = useCallback(() => {
    setEditUiState(resolveEditUiStateOnConnectDifferentDevice());
  }, []);

  const onSignerCancel = useCallback(() => {
    // QueuedBottomSheet calls onClose when isRequestingToBeOpened becomes false — including
    // after the user confirms and we transition to edit-open. Only cancel when still on signer.
    setEditUiState(current => (current === "signer-open" ? "closed" : current));
  }, []);

  const onEditClose = useCallback(() => {
    setEditUiState("closed");
  }, []);

  const resetEditUiState = useCallback(() => {
    setEditUiState("closed");
  }, []);

  return {
    editUiState,
    openSignerDialog,
    openSignerMismatchDialog,
    openEditDialog,
    onSignerConfirm,
    onSignerCancel,
    onSignerMismatchCancel,
    onConnectDifferentDevice,
    onEditClose,
    resetEditUiState,
  };
}
