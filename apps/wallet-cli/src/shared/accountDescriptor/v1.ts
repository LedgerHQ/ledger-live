/**
 * AccountDescriptorV1 — the ADR-specified format, implemented by @domain/entity-account-descriptor.
 *
 * ADR: https://ledgerhq.atlassian.net/wiki/spaces/TA/pages/6975946770/ADR+-+Account+descriptor
 */
export {
  AccountDescriptorSchema as AccountDescriptorV1Schema,
  AddressAccountDescriptorSchema as AccountBasedDescriptorV1Schema,
  UtxoAccountDescriptorSchema as UtxoAccountDescriptorV1Schema,
  parseAccountDescriptor as parseV1,
  serializeAccountDescriptor as serializeV1,
} from "@domain/entity-account-descriptor";
export type {
  AccountDescriptor as AccountDescriptorV1,
  AddressAccountDescriptor as AccountBasedDescriptorV1,
  UtxoAccountDescriptor as UtxoAccountDescriptorV1,
} from "@domain/entity-account-descriptor";
