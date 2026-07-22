import { useCallback, useState } from "react";
import { CONTACT_NAME_MAX_LENGTH } from "../../add/model/constants";
import { useAddContactViewModel } from "../../hooks/useAddContactViewModel";
import type { AddContactDrawerViewModel, UseAddContactDrawerViewModelOptions } from "./types";

export function useAddContactDrawerViewModel({
  contactCreation,
  onSaveSuccess,
}: UseAddContactDrawerViewModelOptions): AddContactDrawerViewModel {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { draftName, isSaveEnabled, save, setDraftName } = useAddContactViewModel(contactCreation);
  const onOpen = useCallback(() => setIsOpen(true), []);
  const onClose = useCallback(() => {
    setIsOpen(false);
    setDraftName("");
  }, [setDraftName]);
  const onDraftNameChange = useCallback(
    (name: string) => setDraftName(name.slice(0, CONTACT_NAME_MAX_LENGTH)),
    [setDraftName],
  );
  const onConfirm = useCallback(async () => {
    if (!isSaveEnabled || isSaving) {
      return;
    }

    setIsSaving(true);

    try {
      await save();
      onSaveSuccess();
      onClose();
    } catch {
      return;
    } finally {
      setIsSaving(false);
    }
  }, [isSaveEnabled, isSaving, onClose, onSaveSuccess, save]);

  return {
    isOpen,
    isConfirmEnabled: isSaveEnabled && !isSaving,
    isSaving,
    draftName,
    onOpen,
    onClose,
    onDraftNameChange,
    onConfirm,
  };
}
