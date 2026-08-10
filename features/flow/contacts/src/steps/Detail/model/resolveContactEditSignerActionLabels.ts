import type { ContactsEditSignerDialogLabels } from "../components/ContactsEditSignerDialog/types";
import type { ContactsEditSignerMismatchDialogLabels } from "../components/ContactsEditSignerMismatchDialog/types";

export type ContactEditSignerActionLabels = Readonly<{
  signer: ContactsEditSignerDialogLabels;
  signerMismatch: ContactsEditSignerMismatchDialogLabels;
}>;

export function resolveContactEditSignerActionLabels(
  t: (key: string) => string,
): ContactEditSignerActionLabels {
  return {
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
