import type { ContactId } from "@domain/entity-contact";
import { useRenameContactDialogViewModel } from "@features/flow-contacts-edit-contact";
import {
  useContactDetailEditDeleteFlowViewModel,
  type ContactDetailActionsPorts,
} from "@features/flow-contacts-detail";

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
    isEditSessionActive: flow.isEditSessionActive,
    onCloseRequest: flow.onEditClose,
    onSaveSuccess: () => undefined,
    requestSaveApproval: flow.requestSaveApproval,
  });

  return { flow, renameViewModel };
}
