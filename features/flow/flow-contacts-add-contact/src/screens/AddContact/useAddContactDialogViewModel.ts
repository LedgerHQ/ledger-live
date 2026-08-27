import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAddContactContentViewModel } from "./useAddContactContentViewModel";
import type { AddContactDialogViewModel, UseAddContactDialogViewModelOptions } from "./types";

/**
 * Reusable open/close/reset/confirm lifecycle for the Add contact dialog, independent of any host
 * analytics or product context. Hosts inject tracking through `callbacks` so Contacts and Pay can
 * report the same interactions under their own flow.
 */
export function useAddContactDialogViewModel({
  contactCreation,
  labels,
  onSaveSuccess,
  callbacks,
}: UseAddContactDialogViewModelOptions): AddContactDialogViewModel {
  const hasTrackedInvalidNameError = useRef(false);
  const [isOpen, setIsOpen] = useState(false);
  const contentViewModel = useAddContactContentViewModel({ contactCreation, onSaveSuccess });
  const { reset, invalidNameError, isSaving, onConfirm: confirmContact } = contentViewModel;
  const onClose = useCallback(() => {
    setIsOpen(false);
    reset();
    callbacks?.onClose?.();
  }, [callbacks, reset]);
  const onOpen = useCallback(() => {
    callbacks?.onOpen?.();
    setIsOpen(true);
  }, [callbacks]);
  const onConfirm = useCallback(async () => {
    if (invalidNameError) {
      return undefined;
    }

    callbacks?.onConfirm?.();

    const createdContact = await confirmContact();
    if (createdContact !== undefined) {
      onClose();
    }
    return createdContact;
  }, [callbacks, confirmContact, invalidNameError, onClose]);
  const isNameErrorDisplayed = useMemo(
    () => isOpen && !isSaving && invalidNameError !== null,
    [invalidNameError, isSaving, isOpen],
  );

  useEffect(() => {
    if (isNameErrorDisplayed && !hasTrackedInvalidNameError.current) {
      hasTrackedInvalidNameError.current = true;
      callbacks?.onInvalidNameErrorDisplayed?.();
      return;
    }

    if (!isNameErrorDisplayed) {
      hasTrackedInvalidNameError.current = false;
    }
  }, [callbacks, isNameErrorDisplayed]);

  return {
    ...contentViewModel,
    isOpen,
    labels,
    onOpen,
    onClose,
    onConfirm,
  };
}
