// wallet-cli keeps its own V0 (wallet-sync) / V1 (canonical descriptor) vocabulary on top of
// `@domain/entity-account-descriptor`, where V1 is simply `AccountDescriptor`.
import {
  AccountDescriptorSchema,
  UtxoAccountDescriptorSchema,
  AddressAccountDescriptorSchema,
  parseAccountDescriptor,
  serializeAccountDescriptor,
  type AccountDescriptor,
  type AddressAccountDescriptor,
  type UtxoAccountDescriptor,
} from "@domain/entity-account-descriptor";
import {
  fromLegacyAccount,
  toLegacyAccount,
} from "@ledgerhq/live-common/account-data/legacyAccount";
import type { AccountDescriptorV0 } from "./v0";

export type { AccountDescriptorV0 } from "./v0";
export { AccountDescriptorV0Schema } from "./v0";

export type AccountDescriptorV1 = AccountDescriptor;
export type UtxoAccountDescriptorV1 = UtxoAccountDescriptor;
export type AccountBasedDescriptorV1 = AddressAccountDescriptor;
export const AccountDescriptorV1Schema = AccountDescriptorSchema;
export const UtxoAccountDescriptorV1Schema = UtxoAccountDescriptorSchema;
export const AccountBasedDescriptorV1Schema = AddressAccountDescriptorSchema;
export const serializeV1 = serializeAccountDescriptor;
export const parseV1 = parseAccountDescriptor;

export type { Network } from "@domain/entity-account-descriptor";
export {
  NetworkSchema,
  parseNetworkArg,
  serializeNetwork,
  networkFromCurrencyId,
  networkStringFromCurrencyId,
  currencyIdFromNetwork,
  UnknownNetworkError,
} from "@domain/entity-account-descriptor";
export { UnsupportedFamilyError } from "@ledgerhq/live-common/account-data/legacyAccount";

export function toV1(v0: AccountDescriptorV0): AccountDescriptorV1 {
  return fromLegacyAccount(v0);
}

/** `freshAddress` is left empty: a descriptor does not carry it. */
export function toV0(v1: AccountDescriptorV1): AccountDescriptorV0 {
  return { ...toLegacyAccount(v1), freshAddress: "" };
}
