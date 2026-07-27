import {
  selectContactById,
  type ContactId,
} from "@domain/entity-contact";
import { useMemo } from "react";
import { useSelector } from "react-redux";
import type { ContactAddressCurrencyPort } from "./model/ports";
import { createPopulatedContactDetailViewModel } from "./model/viewModel";
import type { PopulatedContactDetailViewModel } from "./types";

type ContactsStateRoot = Parameters<typeof selectContactById>[0];

export function usePopulatedContactDetail(
  contactId: ContactId,
  currencyPort: ContactAddressCurrencyPort,
): PopulatedContactDetailViewModel | undefined {
  const contact = useSelector((state: ContactsStateRoot) =>
    selectContactById(state, contactId),
  );

  return useMemo(() => {
    if (contact === undefined || contact.addresses.length === 0) {
      return undefined;
    }

    return createPopulatedContactDetailViewModel(contact, currencyPort);
  }, [contact, currencyPort]);
}
