import type { ContactAddressId, ContactId } from "@domain/entity-contact";

export type ContactAddressDeleteIntent = Readonly<{
  type: "delete-address";
  contactId: ContactId;
  addressId: ContactAddressId;
}>;

export type ContactAddressDeleteLifecycle =
  | Readonly<{ status: "idle" }>
  | Readonly<{ status: "open"; contactId: ContactId; addressId: ContactAddressId }>
  | Readonly<{ status: "success"; contactId: ContactId; addressId: ContactAddressId }>
  | Readonly<{ status: "error"; contactId: ContactId; addressId: ContactAddressId }>;
