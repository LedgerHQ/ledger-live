import { addContact, contact } from "@domain/entity-contact";
import { type ContactCreationPort, useAddContactViewModel } from "@features/flow-contacts";
import { useCallback, useMemo, useState } from "react";
import { v4 as uuid } from "uuid";
import { useDispatch } from "~/context/hooks";
import { useTranslation } from "~/context/Locale";
import type { ContactsAddContactDrawerLabels, ContactsAddContactDrawerViewModel } from "./types";

export function useContactsAddContactDrawerViewModel(
  onSaveSuccess: () => void,
): ContactsAddContactDrawerViewModel {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const contactCreation = useMemo<ContactCreationPort>(
    () => ({
      createContact: async ({ name }) => {
        const createdContact = contact({
          id: `contact-${uuid()}`,
          isMe: false,
          name,
          addresses: [],
        });

        dispatch(addContact(createdContact));

        return createdContact;
      },
    }),
    [dispatch],
  );
  const { draftName, isSaveEnabled, save, setDraftName } = useAddContactViewModel(contactCreation);
  const labels = useMemo<ContactsAddContactDrawerLabels>(
    () => ({
      title: t("contacts.addContact"),
      namePlaceholder: t("contacts.addContactDrawer.namePlaceholder"),
      namingDisclaimer: t("contacts.addContactDrawer.namingDisclaimer"),
      confirmName: t("contacts.addContactDrawer.confirmName"),
    }),
    [t],
  );
  const onOpen = useCallback(() => setIsOpen(true), []);
  const onClose = useCallback(() => {
    setIsOpen(false);
    setDraftName("");
  }, [setDraftName]);
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
    labels,
    onOpen,
    onClose,
    onDraftNameChange: setDraftName,
    onConfirm,
  };
}
