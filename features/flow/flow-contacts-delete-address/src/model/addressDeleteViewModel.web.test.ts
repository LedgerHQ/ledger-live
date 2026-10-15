import { ContactAddressIdSchema } from "@domain/entity-contact";
import { mockContactWithAddress } from "@domain/entity-contact/schema.mock";
import {
  createContactAddressDeleteIntent,
  createErrorContactAddressDeleteLifecycle,
  createIdleContactAddressDeleteLifecycle,
  createOpenContactAddressDeleteLifecycle,
  createSuccessContactAddressDeleteLifecycle,
} from "./addressDeleteViewModel";

describe("createContactAddressDeleteIntent", () => {
  it("exposes a delete-address intent for the selected address", () => {
    const contact = mockContactWithAddress();
    const address = contact.addresses[0]!;

    expect(createContactAddressDeleteIntent(contact.id, address.id)).toEqual({
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
