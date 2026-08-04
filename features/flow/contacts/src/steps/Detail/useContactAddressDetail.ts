import {
  selectContactAddressById,
  type ContactAddressId,
  type ContactId,
} from "@domain/entity-contact";
import { useMemo } from "react";
import { useSelector } from "react-redux";
import type { ContactAddressDetailPort } from "./model/ports";
import { createContactAddressDetailViewModel } from "./model/addressDetailViewModel";
import type { ContactAddressDetailViewModel } from "./types";

type ContactsStateRoot = Parameters<typeof selectContactAddressById>[0];

export function useContactAddressDetail(
  contactId: ContactId,
  addressId: ContactAddressId,
  port: ContactAddressDetailPort,
): ContactAddressDetailViewModel {
  const contactAddress = useSelector((state: ContactsStateRoot) =>
    selectContactAddressById(state, contactId, addressId),
  );

  return useMemo(
    () => createContactAddressDetailViewModel(contactAddress, port),
    [contactAddress, port],
  );
}
