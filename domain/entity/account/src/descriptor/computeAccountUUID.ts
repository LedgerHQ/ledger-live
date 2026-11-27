import { v5 as uuidv5 } from "uuid";
import { accountDescriptorKey, type AccountDescriptor } from "@domain/entity-account-descriptor";
import { AccountUUIDSchema, type AccountUUID } from "../accountUUID";

/** Build-time namespace of AccountUUID. Not a secret; changing it changes every AccountUUID. */
const ACCOUNT_UUID_NAMESPACE = "b4a1d3a8-6c0e-4f0e-9a52-7d1f3c5e8a21";

export function computeAccountUUID(descriptor: AccountDescriptor): AccountUUID {
  return AccountUUIDSchema.parse(uuidv5(accountDescriptorKey(descriptor), ACCOUNT_UUID_NAMESPACE));
}
