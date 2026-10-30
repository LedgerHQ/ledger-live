import type { Portfolio, PortfolioRegistration } from "@domain/api-account-portfolio";
import type {
  AccountDescriptor,
  AddressAccountDescriptor,
} from "@domain/entity-account-descriptor";

/** Ethereum uses coin type 60, Ethereum Classic 61. */
const EVM_PATH = /^m\/44h\/(?:60|61)h\//;
const EVM_ADDRESS = /^0x[0-9a-fA-F]{40}$/;

export function isEvmAccount(
  descriptor: AccountDescriptor,
): descriptor is AddressAccountDescriptor {
  return (
    descriptor.type === "address" &&
    EVM_PATH.test(descriptor.path) &&
    EVM_ADDRESS.test(descriptor.address)
  );
}

/** One registration per address: the service fans it out to every EVM network. */
export const evmRegistration = (descriptor: AddressAccountDescriptor): PortfolioRegistration => ({
  type: "evm",
  address: descriptor.address,
});

/** The id the fan-out gives the account on its network. */
export const serverAccountId = (descriptor: AddressAccountDescriptor) =>
  `${descriptor.network}:${descriptor.address.toLowerCase()}`;

/** Matches a local registration with a server one; undefined for anything but an EVM address. */
export const registrationKey = (registration: {
  readonly type: string;
  readonly address?: string;
}): string | undefined =>
  registration.type === "evm" && registration.address
    ? registration.address.toLowerCase()
    : undefined;

/** One registration per address: an address shared by two networks registers once. */
function wantedRegistrations(descriptors: readonly AccountDescriptor[]) {
  const wanted = new Map<string, PortfolioRegistration>();
  for (const descriptor of descriptors) {
    if (!isEvmAccount(descriptor)) continue;
    const registration = evmRegistration(descriptor);
    const key = registrationKey(registration);
    if (key) wanted.set(key, registration);
  }
  return wanted;
}

/** What the accounts need and the service does not list yet. */
export function missingRegistrations(
  portfolio: Portfolio,
  descriptors: readonly AccountDescriptor[],
): PortfolioRegistration[] {
  const known = new Set((portfolio.registrations ?? []).map(registrationKey));
  return [...wantedRegistrations(descriptors)]
    .filter(([key]) => !known.has(key))
    .map(([, registration]) => registration);
}

/** The EVM registrations the service lists and no account needs; others are not this source's to judge. */
export function unneededRegistrations(
  portfolio: Portfolio,
  descriptors: readonly AccountDescriptor[],
) {
  const wanted = wantedRegistrations(descriptors);
  return (portfolio.registrations ?? []).filter(entry => {
    const key = entry.type === "evm" ? registrationKey(entry) : undefined;
    return key !== undefined && !wanted.has(key);
  });
}
