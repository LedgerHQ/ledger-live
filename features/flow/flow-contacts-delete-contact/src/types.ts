import type { ContactId } from "@domain/entity-contact";

export type ContactDeleteIntent = Readonly<{
  type: "delete-contact";
  contactId: ContactId;
}>;

export type ContactDeleteLifecycle =
  | Readonly<{ status: "idle" }>
  | Readonly<{ status: "open"; contactId: ContactId }>
  | Readonly<{ status: "success"; contactId: ContactId }>
  | Readonly<{ status: "error"; contactId: ContactId }>;
