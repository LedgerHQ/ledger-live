import { configureStore } from "@reduxjs/toolkit";
import {
  ContactError,
  ContactIdSchema,
  ContactNameSchema,
  contactsSlice,
} from "@domain/entity-contact";
import { mockContact, mockContactWithAddress } from "@domain/entity-contact/schema.mock";
import type { ContactDeviceIntentsPort } from "../contactDeviceIntentsPort";
import { createContactEditPort } from "./createContactEditPort";

function makeStore(contacts: ReturnType<typeof contactsSlice.getInitialState>["contacts"]) {
  return configureStore({
    reducer: { contacts: contactsSlice.reducer },
    preloadedState: { contacts: { contacts } },
  });
}

describe("createContactEditPort", () => {
  it("renames a contact without addresses without requesting device credentials", async () => {
    const contact = mockContact();
    const store = makeStore([contact]);
    const renameExternalContact = jest.fn();
    const port = createContactEditPort({
      dispatch: store.dispatch,
      getState: store.getState,
      deviceIntents: { renameExternalContact } as unknown as ContactDeviceIntentsPort,
    });

    const renamed = await port.renameContact({
      contactId: contact.id,
      name: ContactNameSchema.parse("Raphael"),
    });

    expect(renamed.name).toBe("Raphael");
    expect(renameExternalContact).not.toHaveBeenCalled();
  });

  it("renames a contact with addresses using device credentials", async () => {
    const contact = mockContactWithAddress();
    const store = makeStore([contact]);
    const deviceCredentials = { hmacProof: "proof" } as NonNullable<
      typeof contact.deviceCredentials
    >;
    const renameExternalContact = jest.fn().mockResolvedValue(deviceCredentials);
    const port = createContactEditPort({
      dispatch: store.dispatch,
      getState: store.getState,
      deviceIntents: { renameExternalContact } as unknown as ContactDeviceIntentsPort,
    });

    const renamed = await port.renameContact({
      contactId: contact.id,
      name: ContactNameSchema.parse("Raphael"),
    });

    expect(renameExternalContact).toHaveBeenCalledWith({ contact, name: "Raphael" });
    expect(renamed.deviceCredentials).toEqual(deviceCredentials);
  });

  it("rejects an unknown contact", async () => {
    const store = makeStore([]);
    const port = createContactEditPort({
      dispatch: store.dispatch,
      getState: store.getState,
      deviceIntents: {
        renameExternalContact: jest.fn(),
      } as unknown as ContactDeviceIntentsPort,
    });

    await expect(
      port.renameContact({
        contactId: ContactIdSchema.parse("contact-unknown"),
        name: ContactNameSchema.parse("Raphael"),
      }),
    ).rejects.toBeInstanceOf(ContactError);
  });
});
