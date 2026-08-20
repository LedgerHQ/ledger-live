import {
  ContactError,
  deleteAddress as deleteAddressAction,
  parseContactAddressLabel,
  selectContactAddressById,
  selectContactById,
  updateAddress as updateAddressAction,
} from "@domain/entity-contact";
import {
  EditExternalAddressError,
  type ContactDeviceIntentsPort,
} from "@features/platform-contacts";
import type { ContactAddressDetailActionsDataPorts } from "./model/ports";

type ContactAddressDetailActionsPortsDeps = Readonly<{
  dispatch: (action: { type: string }) => void;
  getState: () => Parameters<typeof selectContactAddressById>[0];
  deviceIntents: ContactDeviceIntentsPort;
}>;

export function createContactAddressDetailActionsPorts({
  dispatch,
  getState,
  deviceIntents,
}: ContactAddressDetailActionsPortsDeps): ContactAddressDetailActionsDataPorts {
  return {
    edit: {
      updateAddress: async ({ contactId, addressId, label, address }) => {
        const currentAddress = selectContactAddressById(getState(), contactId, addressId);

        if (currentAddress === undefined) {
          throw new ContactError(`Address not found: ${addressId}`);
        }
        const currentContact = selectContactById(getState(), contactId);
        if (currentContact === undefined) {
          throw new ContactError(`Contact not found: ${contactId}`);
        }
        const parsedLabel = parseContactAddressLabel(label);
        let device;
        try {
          device = await deviceIntents.editExternalAddress({
            contact: currentContact,
            address: currentAddress,
            label: parsedLabel,
            updatedAddress: address,
          });
        } catch (error) {
          if (error instanceof EditExternalAddressError && error.partialResult !== undefined) {
            dispatch(
              updateAddressAction({
                contactId,
                address: {
                  ...currentAddress,
                  address,
                  device: error.partialResult,
                },
              }),
            );
          }
          throw error;
        }

        dispatch(
          updateAddressAction({
            contactId,
            address: {
              ...currentAddress,
              label: parsedLabel,
              address,
              device,
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
