import type { ContactAddress } from "@domain/entity-contact";
import { useCallback, useMemo } from "react";
import { createRenameAddressController } from "./model/controller";
import type { RenameAddressViewModel, UseRenameAddressViewModelOptions } from "./types";

export type UseRenameAddressViewModelResult = RenameAddressViewModel &
  Readonly<{
    save: () => Promise<ContactAddress>;
  }>;

export function useRenameAddressViewModel({
  contactId,
  addressId,
  currentLabel,
  currentAddress,
  draftLabel,
  addressEntry,
  existingLabels,
  editPort,
}: UseRenameAddressViewModelOptions): UseRenameAddressViewModelResult {
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
