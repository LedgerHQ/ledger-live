import {
  contact,
  ContactNameSchema,
  DUPLICATE_CONTACT_NAME_ERROR_NAME,
} from "@domain/entity-contact";
import { createAddContactController } from "./controller";
import type { ContactCreationPort } from "./ports";

function createContactCreationPort(
  implementation: ContactCreationPort["createContact"]
): ContactCreationPort {
  return { createContact: implementation };
}

describe("createAddContactController", () => {
  it("keeps save disabled until the draft name is valid", () => {
    const controller = createAddContactController(
      createContactCreationPort(jest.fn())
    );

    expect(controller.getViewModel("").isSaveEnabled).toBe(false);
    expect(controller.getViewModel("Ben").isSaveEnabled).toBe(true);
  });

  it("exposes the stable invalid name error while the draft name is invalid", () => {
    const controller = createAddContactController(
      createContactCreationPort(jest.fn())
    );

    expect(controller.getViewModel("Olive2")).toMatchObject({
      invalidNameError: "InvalidContactNameError",
      isSaveEnabled: false,
    });
  });

  it("rejects a duplicate name before calling the creation port", async () => {
    const createContact = jest.fn();
    const controller = createAddContactController(
      createContactCreationPort(createContact)
    );
    const existingNames = [ContactNameSchema.parse("Ada")];

    expect(controller.getViewModel(" ada ", existingNames)).toMatchObject({
      invalidNameError: DUPLICATE_CONTACT_NAME_ERROR_NAME,
      isSaveEnabled: false,
    });
    await expect(controller.save(" ada ", existingNames)).rejects.toThrow();
    expect(createContact).not.toHaveBeenCalled();
  });

  it("rejects save when the draft name is empty", async () => {
    const controller = createAddContactController(
      createContactCreationPort(jest.fn())
    );

    await expect(controller.save("")).rejects.toThrow();
  });

  it("creates a contact through the injected creation port", async () => {
    const createContact = jest.fn(async ({ name }) =>
      contact({
        id: "contact-olivia",
        isMe: false,
        name,
        addresses: [],
      })
    );
    const controller = createAddContactController(
      createContactCreationPort(createContact)
    );

    await expect(controller.save("Olivia")).resolves.toMatchObject({
      id: "contact-olivia",
      isMe: false,
      name: "Olivia",
      addresses: [],
    });
    expect(createContact).toHaveBeenCalledWith({ name: "Olivia" });
  });
});
