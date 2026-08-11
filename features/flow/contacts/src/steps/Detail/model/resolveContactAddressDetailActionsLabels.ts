import {
  CONTACT_ADDRESS_LABEL_TOO_LONG_ERROR_NAME,
  DUPLICATE_CONTACT_ADDRESS_LABEL_ERROR_NAME,
  INVALID_CONTACT_ADDRESS_LABEL_ERROR_NAME,
} from "@domain/entity-contact";
import type { ContactsDeleteAddressDialogLabels } from "../components/ContactsDeleteAddressDialog/types";
import type { ContactsEditSignerDialogLabels } from "../components/ContactsEditSignerDialog/types";
import type { ContactsEditSignerMismatchDialogLabels } from "../components/ContactsEditSignerMismatchDialog/types";
import type { ContactsRenameAddressLabels } from "../../EditAddress/types";

export type ContactAddressDetailActionsLabels = Readonly<{
  delete: ContactsDeleteAddressDialogLabels;
  rename: ContactsRenameAddressLabels;
  signer: ContactsEditSignerDialogLabels;
  signerMismatch: ContactsEditSignerMismatchDialogLabels;
}>;

export type ResolveContactAddressDetailActionsLabelsOptions = Readonly<{
  t: (key: string) => string;
  addressLabelTooLongKey?: string;
}>;

export function resolveContactAddressDetailActionsLabels({
  t,
  addressLabelTooLongKey = "contacts.addAddressName.tooLongLabel",
}: ResolveContactAddressDetailActionsLabelsOptions): ContactAddressDetailActionsLabels {
  return {
    delete: {
      title: t("contacts.deleteAddress.title"),
      description: t("contacts.deleteAddress.description"),
      confirm: t("contacts.deleteAddress.confirm"),
      cancel: t("contacts.deleteAddress.cancel"),
    },
    rename: {
      title: t("contacts.editAddress.title"),
      inputLabel: t("contacts.editAddress.inputLabel"),
      applyChanges: t("contacts.editAddress.applyChanges"),
      labelValidationErrors: {
        [INVALID_CONTACT_ADDRESS_LABEL_ERROR_NAME]: t("contacts.editAddress.invalidLabelError"),
        [DUPLICATE_CONTACT_ADDRESS_LABEL_ERROR_NAME]: t("contacts.addAddressName.duplicateLabel"),
        [CONTACT_ADDRESS_LABEL_TOO_LONG_ERROR_NAME]: t(addressLabelTooLongKey),
      },
    },
    signer: {
      title: t("contacts.editSigner.title"),
      description: t("contacts.editSigner.description"),
      confirm: t("contacts.editSigner.confirm"),
      cancel: t("contacts.editSigner.cancel"),
    },
    signerMismatch: {
      title: t("contacts.editSignerMismatch.title"),
      description: t("contacts.editSignerMismatch.description"),
      connectDifferentDevice: t("contacts.editSignerMismatch.connectDifferentDevice"),
      cancel: t("contacts.editSignerMismatch.cancel"),
    },
  };
}
