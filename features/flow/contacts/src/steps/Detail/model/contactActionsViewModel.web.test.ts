import { mockContact, mockContactWithAddress } from "@domain/entity-contact/schema.mock";
import {
  createContactDetailDeleteIntent,
  createContactDetailEditIntent,
  createErrorContactDeleteLifecycle,
  createIdleContactDeleteLifecycle,
  createOpenContactDeleteLifecycle,
  createSuccessContactDeleteLifecycle,
  isSignerRequiredForContactEdit,
  resolveContactEditSignerValidationLookup,
} from "./contactActionsViewModel";

describe("resolveContactEditSignerValidationLookup", () => {
  it("returns undefined when the contact has no addresses", () => {
    expect(resolveContactEditSignerValidationLookup(mockContact())).toBeUndefined();
  });

  it("returns the first address lookup when the contact has addresses", () => {
    const contact = mockContactWithAddress();

    expect(resolveContactEditSignerValidationLookup(contact)).toEqual({
      contactId: contact.id,
      addressId: contact.addresses[0]!.id,
    });
  });
});

describe("createContactDetailEditIntent", () => {
  it("exposes an edit-contact intent with a direct requirement when the contact has no addresses", () => {
    const contact = mockContact();

    expect(createContactDetailEditIntent(contact)).toEqual({
      type: "edit-contact",
      contactId: contact.id,
      editRequirement: {
        type: "direct",
        reason: "contact-has-no-address",
      },
      signerValidationLookup: undefined,
    });
  });

  it("exposes an edit-contact intent with a signer-required requirement when the contact has addresses", () => {
    const contact = mockContactWithAddress();

    expect(createContactDetailEditIntent(contact)).toEqual({
      type: "edit-contact",
      contactId: contact.id,
      editRequirement: {
        type: "confirmation-required",
        reason: "contact-has-address",
      },
      signerValidationLookup: {
        contactId: contact.id,
        addressId: contact.addresses[0]!.id,
      },
    });
  });
});

describe("createContactDetailDeleteIntent", () => {
  it("exposes a delete-contact intent for the selected contact", () => {
    const contact = mockContact();

    expect(createContactDetailDeleteIntent(contact.id)).toEqual({
      type: "delete-contact",
      contactId: contact.id,
    });
  });
});

describe("contact delete lifecycle builders", () => {
  it("creates idle, open, success, and error lifecycle states", () => {
    const contact = mockContact();

    expect(createIdleContactDeleteLifecycle()).toEqual({ status: "idle" });
    expect(createOpenContactDeleteLifecycle(contact.id)).toEqual({
      status: "open",
      contactId: contact.id,
    });
    expect(createSuccessContactDeleteLifecycle(contact.id)).toEqual({
      status: "success",
      contactId: contact.id,
    });
    expect(createErrorContactDeleteLifecycle(contact.id)).toEqual({
      status: "error",
      contactId: contact.id,
    });
  });
});

describe("isSignerRequiredForContactEdit", () => {
  it("returns false when edit is direct", () => {
    expect(isSignerRequiredForContactEdit(createContactDetailEditIntent(mockContact()))).toBe(
      false,
    );
  });

  it("returns true when edit requires signer confirmation", () => {
    expect(
      isSignerRequiredForContactEdit(createContactDetailEditIntent(mockContactWithAddress())),
    ).toBe(true);
  });

  it("returns false when no edit intent is available", () => {
    expect(isSignerRequiredForContactEdit(undefined)).toBe(false);
  });
});
