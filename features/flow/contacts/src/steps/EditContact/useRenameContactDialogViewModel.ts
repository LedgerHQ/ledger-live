import { useCallback, useEffect, useState } from "react";
import { CONTACT_NAME_MAX_LENGTH } from "../AddContact/model/constants";
import { useRenameContactViewModel } from "./useRenameContactViewModel";
import type { RenameContactDialogViewModel, UseRenameContactDialogViewModelOptions } from "./types";

export function useRenameContactDialogViewModel({
  contactId,
  currentName,
  editPort,
  isRequestedOpen,
  onCloseRequest,
  onSaveSuccess,
}: UseRenameContactDialogViewModelOptions &
  Readonly<{
    isRequestedOpen: boolean;
    onCloseRequest: () => void;
  }>): RenameContactDialogViewModel {
  const [draftName, setDraftName] = useState(currentName);
  const [isSaving, setIsSaving] = useState(false);
  const { invalidNameError, isConfirmEnabled, save } = useRenameContactViewModel(
    contactId,
    currentName,
    draftName,
    editPort,
  );

  useEffect(() => {
    if (isRequestedOpen) {
      setDraftName(currentName);
    }
  }, [currentName, isRequestedOpen]);

  const onClose = useCallback(() => {
    onCloseRequest();
    setDraftName(currentName);
  }, [currentName, onCloseRequest]);

  const onDraftNameChange = useCallback(
    (name: string) => setDraftName(name.slice(0, CONTACT_NAME_MAX_LENGTH)),
    [],
  );

  const onConfirm = useCallback(async () => {
    if (!isConfirmEnabled || isSaving) {
      return;
    }

    setIsSaving(true);

    try {
      await save();
      onSaveSuccess();
      onCloseRequest();
    } catch {
      return;
    } finally {
      setIsSaving(false);
    }
  }, [isConfirmEnabled, isSaving, onCloseRequest, onSaveSuccess, save]);

  return {
    isOpen: isRequestedOpen,
    isSaving,
    draftName,
    invalidNameError,
    isConfirmEnabled: isConfirmEnabled && !isSaving,
    onOpen: () => undefined,
    onClose,
    onDraftNameChange,
    onConfirm,
  };
}

export type { UseRenameContactDialogViewModelOptions };
