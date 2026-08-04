import { ContactIdSchema } from "@domain/entity-contact";
import { createContactDetailActionsController } from "./contactActionsController";
import type { ContactDetailActionsPorts } from "./ports";

function createPorts(
  overrides: Partial<ContactDetailActionsPorts> = {},
): ContactDetailActionsPorts {
  return {
    edit: {
      renameContact: jest.fn(),
    },
    deletion: {
      deleteContact: jest.fn().mockResolvedValue(undefined),
    },
    ...overrides,
  };
}

describe("createContactDetailActionsController", () => {
  it("returns success lifecycle when deletion succeeds", async () => {
    const contactId = ContactIdSchema.parse("contact-ben");
    const controller = createContactDetailActionsController(createPorts());

    await expect(controller.confirmDelete(contactId)).resolves.toEqual({
      status: "success",
      contactId,
    });
  });

  it("returns error lifecycle when deletion fails", async () => {
    const contactId = ContactIdSchema.parse("contact-ben");
    const controller = createContactDetailActionsController(
      createPorts({
        deletion: {
          deleteContact: jest.fn().mockRejectedValue(new Error("delete failed")),
        },
      }),
    );

    await expect(controller.confirmDelete(contactId)).resolves.toEqual({
      status: "error",
      contactId,
    });
  });
});
