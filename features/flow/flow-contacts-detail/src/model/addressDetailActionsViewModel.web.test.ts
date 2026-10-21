import { mockContactWithAddress } from "@domain/entity-contact/schema.mock";
import {
  createContactAddressDetailEditIntent,
  createContactAddressDetailSendIntent,
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
  it("exposes an edit-address intent with a signer-required requirement for the selected address", () => {
    const contact = mockContactWithAddress();
    const address = contact.addresses[0]!;

    expect(createContactAddressDetailEditIntent(contact.id, address)).toEqual({
      type: "edit-address",
      contactId: contact.id,
      addressId: address.id,
      editRequirement: {
        type: "confirmation-required",
        reason: "contact-has-address",
      },
    });
  });
});
