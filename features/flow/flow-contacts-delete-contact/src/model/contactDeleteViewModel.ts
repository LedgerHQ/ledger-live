import type { ContactId } from "@domain/entity-contact";
import type { ContactDeleteIntent, ContactDeleteLifecycle } from "../types";

export function createContactDeleteIntent(contactId: ContactId): ContactDeleteIntent {
  return {
    type: "delete-contact",
    contactId,
  };
}

export function createIdleContactDeleteLifecycle(): ContactDeleteLifecycle {
  return { status: "idle" };
}

export function createOpenContactDeleteLifecycle(contactId: ContactId): ContactDeleteLifecycle {
  return { status: "open", contactId };
}

export function createSuccessContactDeleteLifecycle(contactId: ContactId): ContactDeleteLifecycle {
  return { status: "success", contactId };
}

export function createErrorContactDeleteLifecycle(contactId: ContactId): ContactDeleteLifecycle {
  return { status: "error", contactId };
}
