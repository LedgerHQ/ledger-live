import type { ContactId } from "@domain/entity-contact";
import { useCallback, useMemo } from "react";
import { createRenameContactController } from "./model/controller";
import type { ContactEditPort } from "../Detail/model/ports";
import type { RenameContactViewModel } from "./types";

export type UseRenameContactViewModelResult = RenameContactViewModel &
  Readonly<{
    save: () => Promise<import("@domain/entity-contact").Contact>;
  }>;

export function useRenameContactViewModel(
  contactId: ContactId,
  currentName: string,
  draftName: string,
  editPort: ContactEditPort,
): UseRenameContactViewModelResult {
  const controller = useMemo(() => createRenameContactController(editPort), [editPort]);
  const viewModel = useMemo(
    () => controller.getViewModel(draftName, currentName),
    [controller, currentName, draftName],
  );
  const save = useCallback(
    () => controller.save(contactId, draftName),
    [contactId, controller, draftName],
  );

  return {
    ...viewModel,
    save,
  };
}
