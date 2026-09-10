import {
  type ContactCreationPort,
  type AddContactDialogViewModel,
  useAddContactDialogViewModel,
} from "@features/flow-contacts-add-contact";
import type { Contact } from "@domain/entity-contact";
import { useContactsAddContactAnalytics } from "./useContactsAddContactAnalytics";
import type { ContactsAnalyticsHelper } from "../analytics/createContactsAnalyticsHelper";

export type UseAddContactAppAdapterOptions = Readonly<{
  analytics: ContactsAnalyticsHelper;
  contactCreation: ContactCreationPort;
  onSaveSuccess: (contact: Contact) => void;
}>;

export type AddContactAppAdapterResult = AddContactDialogViewModel;

export function useAddContactAppAdapter({
  analytics,
  contactCreation,
  onSaveSuccess,
}: UseAddContactAppAdapterOptions): AddContactAppAdapterResult {
  const { callbacks, onSaveSuccess: handleSaveSuccess } = useContactsAddContactAnalytics(
    analytics,
    onSaveSuccess,
  );

  return useAddContactDialogViewModel({
    contactCreation,
    onSaveSuccess: handleSaveSuccess,
    callbacks,
  });
}
