import type {
  ContactAddress,
  ContactAddressId,
  ContactAddressLabel,
  ContactId,
} from "@domain/entity-contact";
import { useCallback, useMemo } from "react";
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
  draftLabel: string,
  existingLabels: readonly ContactAddressLabel[],
  editPort: ContactAddressEditPort,
): UseRenameAddressViewModelResult {
  const controller = useMemo(() => createRenameAddressController(editPort), [editPort]);
  const viewModel = useMemo(
    () => controller.getViewModel(draftLabel, currentLabel, existingLabels),
    [controller, currentLabel, draftLabel, existingLabels],
  );
  const save = useCallback(
    () => controller.save(contactId, addressId, draftLabel, existingLabels),
    [addressId, contactId, controller, draftLabel, existingLabels],
  );

  return {
    ...viewModel,
    save,
  };
}
