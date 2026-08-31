import { ContactIdSchema } from "@domain/entity-contact";
import { createContactDeleteController } from "./contactDeleteController";
import type { ContactDeletionPort } from "./ports";

function createPort(overrides: Partial<ContactDeletionPort> = {}): ContactDeletionPort {
  return {
    deleteContact: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe("createContactDeleteController", () => {
  it("returns success lifecycle when deletion succeeds", async () => {
    const contactId = ContactIdSchema.parse("contact-ben");
    const controller = createContactDeleteController(createPort());

    await expect(controller.confirmDelete(contactId)).resolves.toEqual({
      status: "success",
      contactId,
    });
  });

  it("returns error lifecycle when deletion fails", async () => {
    const contactId = ContactIdSchema.parse("contact-ben");
    const controller = createContactDeleteController(
      createPort({ deleteContact: jest.fn().mockRejectedValue(new Error("delete failed")) }),
    );

    await expect(controller.confirmDelete(contactId)).resolves.toEqual({
      status: "error",
      contactId,
    });
  });
});
