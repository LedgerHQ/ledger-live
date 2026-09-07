import {
  ContactError,
  parseContactAddressLabel,
  selectContactAddressById,
  selectContactById,
  updateAddress as updateAddressAction,
} from "@domain/entity-contact";
import type { ContactDeviceIntentsPort } from "../contactDeviceIntentsPort";
import type { ContactAddressEditPort } from "./ports";

type CreateContactAddressEditPortDependencies = Readonly<{
  dispatch: (action: { type: string }) => void;
  getState: () => Parameters<typeof selectContactAddressById>[0];
  deviceIntents: ContactDeviceIntentsPort;
}>;

export function createContactAddressEditPort({
  dispatch,
  getState,
  deviceIntents,
}: CreateContactAddressEditPortDependencies): ContactAddressEditPort {
  return {
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
      const device = await deviceIntents.editExternalAddress({
        contact: currentContact,
        address: currentAddress,
        updatedLabel: parsedLabel,
        updatedAddress: address,
      });

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
  };
}
