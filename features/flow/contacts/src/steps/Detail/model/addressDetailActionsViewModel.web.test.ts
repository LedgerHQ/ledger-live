import { ContactAddressIdSchema } from "@domain/entity-contact";
import { mockContactWithAddress } from "@domain/entity-contact/schema.mock";
import {
  createContactAddressDetailDeleteIntent,
  createContactAddressDetailEditIntent,
  createContactAddressDetailSendIntent,
  createErrorContactAddressDeleteLifecycle,
  createIdleContactAddressDeleteLifecycle,
  createOpenContactAddressDeleteLifecycle,
  createSuccessContactAddressDeleteLifecycle,
} from "./addressDetailActionsViewModel";

describe("createContactAddressDetailSendIntent", () => {
  it("exposes a send-address intent with address payload when the address exists", () => {
    const contact = mockContactWithAddress();
    const address = contact.addresses[0]!;

    expect(createContactAddressDetailSendIntent(contact.id, address)).toEqual({
      type: "send-address",
      contactId: contact.id,
      addressId: address.id,
      currencyId: address.currencyId,
      address: address.address,
    });
  });
});

describe("createContactAddressDetailEditIntent", () => {
  it("exposes an edit-address intent for the selected address", () => {
    const contact = mockContactWithAddress();
    const address = contact.addresses[0]!;

    expect(createContactAddressDetailEditIntent(contact.id, address)).toEqual({
      type: "edit-address",
      contactId: contact.id,
      addressId: address.id,
    });
  });
});

describe("createContactAddressDetailDeleteIntent", () => {
  it("exposes a delete-address intent for the selected address", () => {
    const contact = mockContactWithAddress();
    const address = contact.addresses[0]!;

    expect(createContactAddressDetailDeleteIntent(contact.id, address.id)).toEqual({
      type: "delete-address",
      contactId: contact.id,
      addressId: address.id,
    });
  });
});

describe("contact address delete lifecycle builders", () => {
  it("creates idle, open, success, and error lifecycle states", () => {
    const contact = mockContactWithAddress();
    const addressId = ContactAddressIdSchema.parse("address-ethereum");

    expect(createIdleContactAddressDeleteLifecycle()).toEqual({ status: "idle" });
    expect(createOpenContactAddressDeleteLifecycle(contact.id, addressId)).toEqual({
      status: "open",
      contactId: contact.id,
      addressId,
    });
    expect(createSuccessContactAddressDeleteLifecycle(contact.id, addressId)).toEqual({
      status: "success",
      contactId: contact.id,
      addressId,
    });
    expect(createErrorContactAddressDeleteLifecycle(contact.id, addressId)).toEqual({
      status: "error",
      contactId: contact.id,
      addressId,
    });
  });
});
