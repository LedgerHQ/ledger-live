import { mockContact } from "@domain/entity-contact/schema.mock";
import {
  createContactDeleteIntent,
  createErrorContactDeleteLifecycle,
  createIdleContactDeleteLifecycle,
  createOpenContactDeleteLifecycle,
  createSuccessContactDeleteLifecycle,
} from "./contactDeleteViewModel";

describe("createContactDeleteIntent", () => {
  it("exposes a delete-contact intent for the selected contact", () => {
    const contact = mockContact();

    expect(createContactDeleteIntent(contact.id)).toEqual({
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
