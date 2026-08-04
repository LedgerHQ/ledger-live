import type { ContactId } from "@domain/entity-contact";
import type { ContactDetailActionsPorts } from "./model/ports";
import { useRenameContactDialogViewModel } from "../EditContact/useRenameContactDialogViewModel";
import { useContactDetailEditDeleteFlowViewModel } from "./useContactDetailEditDeleteFlowViewModel";

export type UseContactDetailEditDeleteFlowBindingsOptions = Readonly<{
  contactId: ContactId;
  ports: ContactDetailActionsPorts;
  onDeleteSuccess?: () => void;
}>;

export function useContactDetailEditDeleteFlowBindings({
  contactId,
  ports,
  onDeleteSuccess,
}: UseContactDetailEditDeleteFlowBindingsOptions) {
  const flow = useContactDetailEditDeleteFlowViewModel({
    contactId,
    ports,
    onDeleteSuccess,
  });
  const renameViewModel = useRenameContactDialogViewModel({
    contactId,
    currentName: flow.contactName,
    editPort: ports.edit,
    isRequestedOpen: flow.editUiState === "edit-open",
    onCloseRequest: flow.onEditClose,
    onSaveSuccess: () => undefined,
  });

  return { flow, renameViewModel };
}
