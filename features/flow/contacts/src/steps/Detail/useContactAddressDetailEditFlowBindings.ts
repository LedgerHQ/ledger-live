import type { ContactAddressId, ContactId } from "@domain/entity-contact";
import type { ContactsEditSignerDialogProps } from "./components/ContactsEditSignerDialog/types";
import type { ContactAddressDetailEditFlowPorts } from "./model/ports";
import { useContactAddressDetailEditFlowViewModel } from "./useContactAddressDetailEditFlowViewModel";

export type UseContactAddressDetailEditFlowBindingsOptions = Readonly<{
  contactId: ContactId;
  addressId: ContactAddressId;
  ports: ContactAddressDetailEditFlowPorts;
}>;

export type ContactAddressDetailEditSignerDialogBindings = Pick<
  ContactsEditSignerDialogProps,
  "isOpen" | "onConfirm" | "onCancel"
>;

export function useContactAddressDetailEditFlowBindings({
  contactId,
  addressId,
  ports,
}: UseContactAddressDetailEditFlowBindingsOptions) {
  const flow = useContactAddressDetailEditFlowViewModel({
    contactId,
    addressId,
    ports,
  });

  const signerDialog: ContactAddressDetailEditSignerDialogBindings = {
    isOpen: flow.editUiState === "signer-open",
    onConfirm: flow.onSignerConfirm,
    onCancel: flow.onSignerCancel,
  };

  return { flow, signerDialog };
}
