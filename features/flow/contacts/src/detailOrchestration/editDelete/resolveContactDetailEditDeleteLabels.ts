import {
  DUPLICATE_CONTACT_NAME_ERROR_NAME,
  INVALID_CONTACT_NAME_ERROR_NAME,
} from "@domain/entity-contact";
import {
  resolveContactEditSignerActionLabels,
  type ContactDetailActionsLabels,
  type ContactsDeleteContactDialogLabels,
} from "@features/flow-contacts-detail";
import type { ContactsRenameContactLabels } from "@features/flow-contacts-edit-contact";

export type ContactDetailEditDeleteLabels = Readonly<{
  actions: ContactDetailActionsLabels;
  rename: ContactsRenameContactLabels;
  delete: ContactsDeleteContactDialogLabels;
}> &
  ReturnType<typeof resolveContactEditSignerActionLabels>;

export type ResolveContactDetailEditDeleteLabelsOptions = Readonly<{
  t: (key: string) => string;
  editContactLabelKey?: string;
  deleteDescriptionKey?: string;
}>;

export function resolveContactDetailEditDeleteLabels({
  t,
  editContactLabelKey = "contacts.detailActions.editContact",
  deleteDescriptionKey = "contacts.deleteContact.description",
}: ResolveContactDetailEditDeleteLabelsOptions): ContactDetailEditDeleteLabels {
  return {
    actions: {
      editContact: t(editContactLabelKey),
      deleteContact: t("contacts.detailActions.deleteContact"),
    },
    rename: {
      title: t("contacts.editContact.title"),
      namePlaceholder: t("contacts.editContact.namePlaceholder"),
      namingDisclaimer: t("contacts.editContact.namingDisclaimer"),
      applyChanges: t("contacts.editContact.applyChanges"),
      confirmName: t("contacts.editContact.confirmName"),
      nameValidationErrors: {
        [INVALID_CONTACT_NAME_ERROR_NAME]: t("contacts.editContact.invalidNameError"),
        [DUPLICATE_CONTACT_NAME_ERROR_NAME]: t("contacts.addContactDrawer.duplicateNameError"),
      },
    },
    delete: {
      title: t("contacts.deleteContact.title"),
      description: t(deleteDescriptionKey),
      confirm: t("contacts.deleteContact.confirm"),
      cancel: t("contacts.deleteContact.cancel"),
    },
    ...resolveContactEditSignerActionLabels(t),
  };
}
