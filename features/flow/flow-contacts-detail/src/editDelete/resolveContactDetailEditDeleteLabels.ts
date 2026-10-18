import {
  DUPLICATE_CONTACT_NAME_ERROR_NAME,
  INVALID_CONTACT_NAME_ERROR_NAME,
} from "@domain/entity-contact";
import type { ContactsRenameContactLabels } from "@features/flow-contacts-edit-contact";
import type { ContactDetailActionsLabels } from "../types";
import { resolveContactEditSignerActionLabels } from "../model/resolveContactEditSignerActionLabels";

export type ContactDetailEditDeleteLabels = Readonly<{
  actions: ContactDetailActionsLabels;
  rename: ContactsRenameContactLabels;
}> &
  ReturnType<typeof resolveContactEditSignerActionLabels>;

export type ResolveContactDetailEditDeleteLabelsOptions = Readonly<{
  t: (key: string) => string;
  editContactLabelKey?: string;
}>;

export function resolveContactDetailEditDeleteLabels({
  t,
  editContactLabelKey = "contacts.detailActions.editContact",
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
    ...resolveContactEditSignerActionLabels(t),
  };
}
