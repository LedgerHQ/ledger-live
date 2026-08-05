import { deleteAddress as deleteAddressAction, selectContactById } from "@domain/entity-contact";
import type { ContactSignerValidationPort } from "../../platform/contactSignerValidationPort";
import type { ContactAddressDetailEditFlowPorts } from "./model/ports";

type ContactAddressDetailEditFlowPortsDeps = Readonly<{
  dispatch: (action: { type: string }) => void;
  getState: () => Parameters<typeof selectContactById>[0];
  signerValidation: ContactSignerValidationPort;
}>;

export function createContactAddressDetailEditFlowPorts({
  dispatch,
  getState,
  signerValidation,
}: ContactAddressDetailEditFlowPortsDeps): ContactAddressDetailEditFlowPorts {
  return {
    deletion: {
      deleteAddress: async ({ contactId, addressId }) => {
        dispatch(deleteAddressAction({ contactId, addressId }));
      },
    },
    signerValidation,
  };
}
