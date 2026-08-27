import {
  CONTACT_ADDRESS_LABEL_TOO_LONG_ERROR_NAME,
  DUPLICATE_CONTACT_ADDRESS_LABEL_ERROR_NAME,
  INVALID_CONTACT_ADDRESS_LABEL_ERROR_NAME,
} from "@domain/entity-contact";
import type { ContactsDeleteAddressDialogLabels } from "../components/ContactsDeleteAddressDialog/types";
import type { ContactsRenameAddressLabels } from "@features/flow-contacts-edit-address";
import { resolveContactEditSignerActionLabels } from "./resolveContactEditSignerActionLabels";

export type ContactAddressDetailActionsLabels = Readonly<{
  delete: ContactsDeleteAddressDialogLabels;
  rename: ContactsRenameAddressLabels;
}> &
  ReturnType<typeof resolveContactEditSignerActionLabels>;

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
      addressValidation: {
        addressPlaceholder: t("contacts.addAddressEntry.addressPlaceholder"),
        validatingAddress: t("contacts.addAddressEntry.validatingAddress"),
        validAddress: t("contacts.addAddressEntry.validAddress"),
        invalidAddress: t("contacts.addAddressEntry.invalidAddress"),
        domainNotFound: t("contacts.addAddressEntry.domainNotFound"),
        sanctionedAddress: t("contacts.addAddressEntry.sanctionedAddress"),
        validationUnavailable: t("contacts.addAddressEntry.validationUnavailable"),
        ensDisclaimer: t("contacts.addAddressEntry.ensDisclaimer"),
      },
    },
    ...resolveContactEditSignerActionLabels(t),
  };
}
