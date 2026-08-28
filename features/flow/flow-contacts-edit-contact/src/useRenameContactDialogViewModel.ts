import { useCallback, useEffect, useState } from "react";
import { CONTACT_NAME_MAX_LENGTH } from "@domain/entity-contact";
import { useRenameContactViewModel } from "./useRenameContactViewModel";
import type { RenameContactDialogViewModel, UseRenameContactDialogViewModelOptions } from "./types";

export function useRenameContactDialogViewModel({
  contactId,
  currentName,
  editPort,
  isRequestedOpen,
  isEditSessionActive = isRequestedOpen,
  onCloseRequest,
  onSaveSuccess,
  requestSaveApproval,
}: UseRenameContactDialogViewModelOptions): RenameContactDialogViewModel {
  const [draftName, setDraftName] = useState(currentName);
  const [isSaving, setIsSaving] = useState(false);
  const { invalidNameError, isConfirmEnabled, save } = useRenameContactViewModel(
    contactId,
    currentName,
    draftName,
    editPort,
  );

  useEffect(() => {
    if (isEditSessionActive) {
      setDraftName(currentName);
    }
  }, [currentName, isEditSessionActive]);

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
      if (requestSaveApproval !== undefined && !(await requestSaveApproval())) {
        return;
      }

      /**
       * Dismiss the dialog before save(): the Device Intent Executor takes over the device
       * interaction UI.
       */
      onCloseRequest();
      await save();
      onSaveSuccess();
    } catch {
      return;
    } finally {
      setIsSaving(false);
    }
  }, [isConfirmEnabled, isSaving, onCloseRequest, onSaveSuccess, requestSaveApproval, save]);

  return {
    isOpen: isRequestedOpen,
    isSaving,
    draftName,
    invalidNameError,
    isConfirmEnabled: isConfirmEnabled && !isSaving,
    onOpen: () => undefined,
    onClose: onCloseRequest,
    onDraftNameChange,
    onConfirm,
  };
}

export type { UseRenameContactDialogViewModelOptions };
