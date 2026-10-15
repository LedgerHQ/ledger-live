import {
  selectContactAddressById,
  type ContactAddressId,
  type ContactId,
} from "@domain/entity-contact";
import { useMemo } from "react";
import { useSelector } from "react-redux";
import {
  createContactAddressDetailEditIntent,
  createContactAddressDetailSendIntent,
} from "./model/addressDetailActionsViewModel";
import { isSignerConfirmationRequired } from "./model/editRequirement";
import type { ContactAddressDetailActionsViewModel } from "./types";

type ContactsStateRoot = Parameters<typeof selectContactAddressById>[0];

export type UseContactAddressDetailActionsViewModelResult = ContactAddressDetailActionsViewModel;

export function useContactAddressDetailActionsViewModel(
  contactId: ContactId,
  addressId: ContactAddressId,
): UseContactAddressDetailActionsViewModelResult {
  const contactAddress = useSelector((state: ContactsStateRoot) =>
    selectContactAddressById(state, contactId, addressId),
  );
  const sendIntent = useMemo(
    () =>
      contactAddress === undefined
        ? undefined
        : createContactAddressDetailSendIntent(contactId, contactAddress),
    [contactAddress, contactId],
  );
  const editIntent = useMemo(
    () =>
      contactAddress === undefined
        ? undefined
        : createContactAddressDetailEditIntent(contactId, contactAddress),
    [contactAddress, contactId],
  );
  const isSignerRequiredForEdit = isSignerConfirmationRequired(editIntent?.editRequirement);

  return {
    sendIntent,
    editIntent,
    isSignerRequiredForEdit,
  };
}
