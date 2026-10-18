import type { Contact } from "@domain/entity-contact";
import { type AddContactAppAdapterResult, useAddContactAppAdapter } from "@features/flow-contacts";
import { createContactCreationPort } from "@features/flow-contacts-add-contact";
import { useMemo } from "react";
import { v4 as uuid } from "uuid";
import { useDispatch } from "LLD/hooks/redux";
import { useContactsAnalytics } from "../../analytics";

export function useAddContactDialogAdapter(
  onSaveSuccess: (contact: Contact) => void,
): AddContactAppAdapterResult {
  const dispatch = useDispatch();
  const analytics = useContactsAnalytics();
  const contactCreation = useMemo(
    () => createContactCreationPort({ dispatch, generateId: uuid }),
    [dispatch],
  );

  return useAddContactAppAdapter({
    analytics,
    contactCreation,
    onSaveSuccess,
  });
}
