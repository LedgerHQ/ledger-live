import { useMemo } from "react";
import { v4 as uuid } from "uuid";
import type { Contact } from "@domain/entity-contact";
import { type AddContactAppAdapterResult, useAddContactAppAdapter } from "@features/flow-contacts";
import { createContactCreationPort } from "@features/flow-contacts-add-contact";
import { useDispatch } from "~/context/hooks";
import { useContactsAnalytics } from "../../../analytics/useContactsAnalytics";

export function useContactsAddContactDrawerAdapter(
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
