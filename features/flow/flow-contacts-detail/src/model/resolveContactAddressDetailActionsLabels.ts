import {
  CONTACT_ADDRESS_LABEL_TOO_LONG_ERROR_NAME,
  DUPLICATE_CONTACT_ADDRESS_LABEL_ERROR_NAME,
  INVALID_CONTACT_ADDRESS_LABEL_ERROR_NAME,
} from "@domain/entity-contact";
import type { ContactsRenameAddressLabels } from "@features/flow-contacts-edit-address";
import { resolveContactEditSignerActionLabels } from "./resolveContactEditSignerActionLabels";

export type ContactAddressDetailActionsLabels = Readonly<{
  rename: ContactsRenameAddressLabels;
}> &
  ReturnType<typeof resolveContactEditSignerActionLabels>;

export type ResolveContactAddressDetailActionsLabelsOptions = Readonly<{
  t: (key: string, options?: Record<string, unknown>) => string;
  addressLabelTooLongKey?: string;
  supportsDomain: boolean;
}>;

export function resolveContactAddressDetailActionsLabels({
  t,
  addressLabelTooLongKey = "contacts.addAddressName.tooLongLabel",
  supportsDomain,
}: ResolveContactAddressDetailActionsLabelsOptions): ContactAddressDetailActionsLabels {
  return {
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
        addressPlaceholder: t(
          supportsDomain
            ? "contacts.addAddressEntry.addressPlaceholder"
            : "contacts.addAddressEntry.addressPlaceholderNoENS",
        ),
        validatingAddress: t("contacts.addAddressEntry.validatingAddress"),
        validAddress: t("contacts.addAddressEntry.validAddress"),
        invalidAddress: t("contacts.addAddressEntry.invalidAddress"),
        domainNotFound: t("contacts.addAddressEntry.domainNotFound"),
        sanctionedAddress: t("contacts.addAddressEntry.sanctionedAddress"),
        validationUnavailable: t("contacts.addAddressEntry.validationUnavailable"),
        ensDisclaimer: t("contacts.addAddressEntry.ensDisclaimer"),
        ensDisclaimerDescription: t("contacts.addAddressEntry.ensDisclaimerDescription"),
        duplicateAddress: (contactName: string) =>
          t("contacts.addAddressEntry.duplicateAddress", { contactName }),
      },
    },
    ...resolveContactEditSignerActionLabels(t),
  };
}
