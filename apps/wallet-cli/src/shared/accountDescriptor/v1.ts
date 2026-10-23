/**
 * AccountDescriptorV1 — the ADR-specified format, implemented by @domain/entity-account-descriptor.
 *
 * ADR: https://ledgerhq.atlassian.net/wiki/spaces/TA/pages/6975946770/ADR+-+Account+descriptor
 */
import {
  InvalidAccountDescriptorError,
  parseAccountDescriptor,
  type AccountDescriptor,
} from "@domain/entity-account-descriptor";

export {
  AccountDescriptorSchema as AccountDescriptorV1Schema,
  AddressAccountDescriptorSchema as AccountBasedDescriptorV1Schema,
  UtxoAccountDescriptorSchema as UtxoAccountDescriptorV1Schema,
  serializeAccountDescriptor as serializeV1,
} from "@domain/entity-account-descriptor";
export type {
  AccountDescriptor as AccountDescriptorV1,
  AddressAccountDescriptor as AccountBasedDescriptorV1,
  UtxoAccountDescriptor as UtxoAccountDescriptorV1,
} from "@domain/entity-account-descriptor";

/** ADR version 1 `<name>:<env>` network -> network id: `bitcoin:main` -> `bitcoin`, `bitcoin:testnet` -> `bitcoin_testnet`. */
export const networkFromLegacy = (name: string, env: string): string =>
  env === "main" ? name : `${name}_${env}`;

/** `account:1:<type>:<name>:<env>:…`, persisted by older wallet-cli, -> `account:2:<type>:<network_id>:…`. */
export function upgradeLegacyDescriptor(input: string): string {
  const [purpose, version, type, name, env, ...rest] = input.split(":");
  if (purpose !== "account" || version !== "1" || rest.length < 2) return input;
  return [purpose, "2", type, networkFromLegacy(name, env), ...rest].join(":");
}

/** Parses an ADR descriptor, upgrading a version 1 string first; a `mock` descriptor is not an account wallet-cli can use. */
export function parseV1(input: string): AccountDescriptor {
  const descriptor = parseAccountDescriptor(upgradeLegacyDescriptor(input));
  if (descriptor.purpose !== "account") {
    throw new InvalidAccountDescriptorError(
      `Invalid AccountDescriptor: wallet-cli only reads purpose "account"`,
    );
  }
  return descriptor;
}
