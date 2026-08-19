import type {
  ContactAddress,
  ContactAddressId,
  ContactAddressLabel,
  ContactId,
} from "@domain/entity-contact";
import { useCallback, useMemo } from "react";
import type { ContactsAddressEntryState } from "@features/platform-contacts";
import type { ContactAddressEditPort } from "../Detail/model/ports";
import { createRenameAddressController } from "./model/controller";
import type { RenameAddressViewModel } from "./types";

export type UseRenameAddressViewModelResult = RenameAddressViewModel &
  Readonly<{
    save: () => Promise<ContactAddress>;
  }>;

export function useRenameAddressViewModel(
  contactId: ContactId,
  addressId: ContactAddressId,
  currentLabel: string,
  currentAddress: ContactAddress["address"] | undefined,
  draftLabel: string,
  addressEntry: ContactsAddressEntryState,
  existingLabels: readonly ContactAddressLabel[],
  editPort: ContactAddressEditPort,
): UseRenameAddressViewModelResult {
  const controller = useMemo(() => createRenameAddressController(editPort), [editPort]);
  const viewModel = useMemo(
    () =>
      controller.getViewModel(
        draftLabel,
        currentLabel,
        currentAddress,
        addressEntry,
        existingLabels,
      ),
    [addressEntry, controller, currentAddress, currentLabel, draftLabel, existingLabels],
  );
  const save = useCallback(
    () => controller.save(contactId, addressId, draftLabel, addressEntry, existingLabels),
    [addressEntry, addressId, contactId, controller, draftLabel, existingLabels],
  );

  return {
    ...viewModel,
    save,
  };
}
