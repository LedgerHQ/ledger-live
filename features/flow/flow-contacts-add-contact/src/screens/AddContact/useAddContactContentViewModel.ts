import { useCallback, useState } from "react";
import { CONTACT_NAME_MAX_LENGTH } from "@domain/entity-contact";
import { useAddContactViewModel } from "./useAddContactViewModel";
import type { AddContactContentViewModel, UseAddContactContentViewModelOptions } from "./types";

export function useAddContactContentViewModel({
  contactCreation,
  onSaveSuccess,
}: UseAddContactContentViewModelOptions): AddContactContentViewModel {
  const [isSaving, setIsSaving] = useState(false);
  const { avatarInitial, draftName, invalidNameError, isSaveEnabled, save, setDraftName } =
    useAddContactViewModel(contactCreation);
  const reset = useCallback(() => setDraftName(""), [setDraftName]);
  const onDraftNameChange = useCallback(
    (name: string) => {
      if (!isSaving) {
        setDraftName(name.slice(0, CONTACT_NAME_MAX_LENGTH));
      }
    },
    [isSaving, setDraftName],
  );
  const onConfirm = useCallback(async () => {
    if (!isSaveEnabled || isSaving) {
      return undefined;
    }

    setIsSaving(true);

    try {
      const createdContact = await save();
      try {
        onSaveSuccess(createdContact);
      } catch {
        return createdContact;
      }
      return createdContact;
    } catch {
      return undefined;
    } finally {
      setIsSaving(false);
    }
  }, [isSaveEnabled, isSaving, onSaveSuccess, save]);

  return {
    isConfirmEnabled: isSaveEnabled && !isSaving,
    isSaving,
    draftName,
    avatarInitial,
    invalidNameError: isSaving ? null : invalidNameError,
    onDraftNameChange,
    onConfirm,
    reset,
  };
}
