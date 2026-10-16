import type { ContactDetailActionsLabels } from "../types";
import { resolveContactEditSignerActionLabels } from "../model/resolveContactEditSignerActionLabels";

export type ContactDetailEditDeleteLabels = Readonly<{
  actions: ContactDetailActionsLabels;
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
    ...resolveContactEditSignerActionLabels(t),
  };
}
