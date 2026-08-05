import {
  ContactError,
  deleteAddress as deleteAddressAction,
  parseContactAddressLabel,
  selectContactAddressById,
  updateAddress as updateAddressAction,
} from "@domain/entity-contact";
import type { ContactAddressDetailActionsDataPorts } from "./model/ports";

type ContactAddressDetailActionsPortsDeps = Readonly<{
  dispatch: (action: { type: string }) => void;
  getState: () => Parameters<typeof selectContactAddressById>[0];
}>;

export function createContactAddressDetailActionsPorts({
  dispatch,
  getState,
}: ContactAddressDetailActionsPortsDeps): ContactAddressDetailActionsDataPorts {
  return {
    edit: {
      renameAddressLabel: async ({ contactId, addressId, label }) => {
        const currentAddress = selectContactAddressById(getState(), contactId, addressId);

        if (currentAddress === undefined) {
          throw new ContactError(`Address not found: ${addressId}`);
        }

        dispatch(
          updateAddressAction({
            contactId,
            address: {
              ...currentAddress,
              label: parseContactAddressLabel(label),
            },
          }),
        );

        const updatedAddress = selectContactAddressById(getState(), contactId, addressId);

        if (updatedAddress === undefined) {
          throw new ContactError(`Address not found after update: ${addressId}`);
        }

        return updatedAddress;
      },
    },
    deletion: {
      deleteAddress: async input => {
        dispatch(deleteAddressAction(input));
      },
    },
  };
}
