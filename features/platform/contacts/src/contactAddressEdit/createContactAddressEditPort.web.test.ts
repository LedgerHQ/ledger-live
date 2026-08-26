import { configureStore } from "@reduxjs/toolkit";
import {
  ContactAddressIdSchema,
  ContactAddressLabelSchema,
  ContactAddressValueSchema,
  ContactError,
  contactsSlice,
} from "@domain/entity-contact";
import { mockContactWithAddress } from "@domain/entity-contact/schema.mock";
import {
  createMockContactDeviceIntentsPort,
  type ContactDeviceIntentsPort,
} from "../contactDeviceIntentsPort";
import { createContactAddressEditPort } from "./createContactAddressEditPort";

function makeStore(contacts: ReturnType<typeof contactsSlice.getInitialState>["contacts"]) {
  return configureStore({
    reducer: { contacts: contactsSlice.reducer },
    preloadedState: { contacts: { contacts } },
  });
}

describe("createContactAddressEditPort", () => {
  it("should update an address with device credentials", async () => {
    const contact = mockContactWithAddress();
    const address = contact.addresses[0]!;
    const store = makeStore([contact]);
    const device = { ...address.device, hmacRest: "updated-proof" };
    const editExternalAddress = jest.fn().mockResolvedValue(device);
    const label = ContactAddressLabelSchema.parse("Treasury");
    const updatedAddressValue = ContactAddressValueSchema.parse(
      "0x2ad23b2cf8d2e0591ea417eb82f7cd9746c53034",
    );
    const port = createContactAddressEditPort({
      dispatch: store.dispatch,
      getState: store.getState,
      deviceIntents: { editExternalAddress } as unknown as ContactDeviceIntentsPort,
    });

    const updatedAddress = await port.updateAddress({
      contactId: contact.id,
      addressId: address.id,
      label,
      address: updatedAddressValue,
    });

    expect(editExternalAddress).toHaveBeenCalledWith({
      contact,
      address,
      updatedLabel: label,
      updatedAddress: updatedAddressValue,
    });
    expect(updatedAddress).toEqual({
      ...address,
      label,
      address: updatedAddressValue,
      device,
    });
  });

  it("should reject an unknown address", async () => {
    const contact = mockContactWithAddress();
    const store = makeStore([contact]);
    const port = createContactAddressEditPort({
      dispatch: store.dispatch,
      getState: store.getState,
      deviceIntents: createMockContactDeviceIntentsPort(),
    });

    await expect(
      port.updateAddress({
        contactId: contact.id,
        addressId: ContactAddressIdSchema.parse("address-unknown"),
        label: ContactAddressLabelSchema.parse("Treasury"),
        address: ContactAddressValueSchema.parse("0x2ad23b2cf8d2e0591ea417eb82f7cd9746c53034"),
      }),
    ).rejects.toBeInstanceOf(ContactError);
  });
});
