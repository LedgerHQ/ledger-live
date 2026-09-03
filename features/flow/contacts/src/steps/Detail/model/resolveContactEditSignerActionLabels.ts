import type { ContactsEditSignerMismatchDialogLabels } from "../components/ContactsEditSignerMismatchDialog/types";

export type ContactEditSignerActionLabels = Readonly<{
  signerMismatch: ContactsEditSignerMismatchDialogLabels;
}>;

export function resolveContactEditSignerActionLabels(
  t: (key: string) => string,
): ContactEditSignerActionLabels {
  return {
    signerMismatch: {
      title: t("contacts.editSignerMismatch.title"),
      description: t("contacts.editSignerMismatch.description"),
      connectDifferentDevice: t("contacts.editSignerMismatch.connectDifferentDevice"),
      cancel: t("contacts.editSignerMismatch.cancel"),
    },
  };
}
