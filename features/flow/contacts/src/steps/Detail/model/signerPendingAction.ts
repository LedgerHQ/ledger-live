import type {
  ContactAddressDetailDeleteIntent,
  ContactAddressDetailEditIntent,
} from "../types";

export type SignerPendingAction = "edit" | "delete";

type SignerValidationTarget = Readonly<{
  contactId: ContactAddressDetailEditIntent["contactId"];
  addressId: ContactAddressDetailEditIntent["addressId"];
}>;

export function resolveSignerValidationTarget(
  pendingAction: SignerPendingAction | null,
  editIntent: ContactAddressDetailEditIntent | undefined,
  deleteIntent: ContactAddressDetailDeleteIntent,
): SignerValidationTarget | undefined {
  if (pendingAction === "edit") {
    return editIntent;
  }

  if (pendingAction === "delete") {
    return deleteIntent;
  }

  return undefined;
}
