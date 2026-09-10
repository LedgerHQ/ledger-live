import type { ContactsDeleteAddressDialogLabels } from "../components/ContactsDeleteAddressDialog/types";
import { resolveContactEditSignerActionLabels } from "./resolveContactEditSignerActionLabels";

export type ContactAddressDetailActionsLabels = Readonly<{
  delete: ContactsDeleteAddressDialogLabels;
}> &
  ReturnType<typeof resolveContactEditSignerActionLabels>;

export type ResolveContactAddressDetailActionsLabelsOptions = Readonly<{
  t: (key: string) => string;
}>;

export function resolveContactAddressDetailActionsLabels({
  t,
}: ResolveContactAddressDetailActionsLabelsOptions): ContactAddressDetailActionsLabels {
  return {
    delete: {
      title: t("contacts.deleteAddress.title"),
      description: t("contacts.deleteAddress.description"),
      confirm: t("contacts.deleteAddress.confirm"),
      cancel: t("contacts.deleteAddress.cancel"),
    },
    ...resolveContactEditSignerActionLabels(t),
  };
}
