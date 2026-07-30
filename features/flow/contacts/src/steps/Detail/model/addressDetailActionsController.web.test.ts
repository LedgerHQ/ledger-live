import { ContactAddressIdSchema, ContactIdSchema } from "@domain/entity-contact";
import { createContactAddressDetailActionsController } from "./addressDetailActionsController";
import type { ContactAddressDetailActionsPorts } from "./ports";

function createPorts(
  overrides: Partial<ContactAddressDetailActionsPorts> = {},
): ContactAddressDetailActionsPorts {
  return {
    deletion: {
      deleteAddress: jest.fn().mockResolvedValue(undefined),
    },
    ...overrides,
  };
}

describe("createContactAddressDetailActionsController", () => {
  it("returns success lifecycle when deletion succeeds", async () => {
    const contactId = ContactIdSchema.parse("contact-ben");
    const addressId = ContactAddressIdSchema.parse("address-ethereum");
    const controller = createContactAddressDetailActionsController(createPorts());

    await expect(controller.confirmDelete(contactId, addressId)).resolves.toEqual({
      status: "success",
      contactId,
      addressId,
    });
  });

  it("returns error lifecycle when deletion fails", async () => {
    const contactId = ContactIdSchema.parse("contact-ben");
    const addressId = ContactAddressIdSchema.parse("address-ethereum");
    const controller = createContactAddressDetailActionsController(
      createPorts({
        deletion: {
          deleteAddress: jest.fn().mockRejectedValue(new Error("delete failed")),
        },
      }),
    );

    await expect(controller.confirmDelete(contactId, addressId)).resolves.toEqual({
      status: "error",
      contactId,
      addressId,
    });
  });
});
