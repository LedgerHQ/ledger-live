import { mockContact, mockContactWithAddress } from "@domain/entity-contact/schema.mock";
import {
  createContactDetailEditIntent,
  isSignerRequiredForContactEdit,
  resolveContactEditSignerValidationLookup,
} from "./contactActionsViewModel";

describe("resolveContactEditSignerValidationLookup", () => {
  it("returns the first address lookup only when one exists", () => {
    expect(resolveContactEditSignerValidationLookup(mockContact())).toBeUndefined();
    const contact = mockContactWithAddress();
    expect(resolveContactEditSignerValidationLookup(contact)).toEqual({
      contactId: contact.id,
      addressId: contact.addresses[0]!.id,
    });
  });
});

describe("createContactDetailEditIntent", () => {
  it("resolves direct and signer-confirmed edit requirements", () => {
    expect(isSignerRequiredForContactEdit(createContactDetailEditIntent(mockContact()))).toBe(
      false,
    );
    expect(
      isSignerRequiredForContactEdit(createContactDetailEditIntent(mockContactWithAddress())),
    ).toBe(true);
  });
});
