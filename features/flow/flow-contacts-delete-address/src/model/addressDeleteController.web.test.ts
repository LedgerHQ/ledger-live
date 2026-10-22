import { ContactAddressIdSchema, ContactIdSchema } from "@domain/entity-contact";
import { createContactAddressDeleteController } from "./addressDeleteController";
import type { ContactAddressDeletionPort } from "./ports";

function createPort(
  overrides: Partial<ContactAddressDeletionPort> = {},
): ContactAddressDeletionPort {
  return {
    deleteAddress: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe("createContactAddressDeleteController", () => {
  it("returns success lifecycle when deletion succeeds", async () => {
    const contactId = ContactIdSchema.parse("contact-ben");
    const addressId = ContactAddressIdSchema.parse("address-ethereum");
    const controller = createContactAddressDeleteController(createPort());

    await expect(controller.confirmDelete(contactId, addressId)).resolves.toEqual({
      status: "success",
      contactId,
      addressId,
    });
  });

  it("returns error lifecycle when deletion fails", async () => {
    const contactId = ContactIdSchema.parse("contact-ben");
    const addressId = ContactAddressIdSchema.parse("address-ethereum");
    const controller = createContactAddressDeleteController(
      createPort({
        deleteAddress: jest.fn().mockRejectedValue(new Error("delete failed")),
      }),
    );

    await expect(controller.confirmDelete(contactId, addressId)).resolves.toEqual({
      status: "error",
      contactId,
      addressId,
    });
  });
});
