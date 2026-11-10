import type { Portfolio, PortfolioRegistration } from "@domain/api-account-portfolio";
import type { AccountDescriptor } from "@domain/entity-account-descriptor";
import { autoDeriveFamily } from "./autoDerive";
import { evmFamily } from "./evm";
import type { PortfolioAccountRef, PortfolioFamily, RegistrationLike } from "./family";

const FAMILIES: readonly PortfolioFamily[] = [evmFamily, autoDeriveFamily];

/** How the service tracks the account; undefined for one this source does not serve. */
export function portfolioAccountOf(descriptor: AccountDescriptor): PortfolioAccountRef | undefined {
  for (const family of FAMILIES) {
    const ref = family.accountOf(descriptor);
    if (ref) return ref;
  }
  return undefined;
}

export const isPortfolioAccount = (descriptor: AccountDescriptor) =>
  portfolioAccountOf(descriptor) !== undefined;

/** Matches a local registration with a listed one; undefined for a shape this source never sends. */
export function registrationKey(registration: RegistrationLike): string | undefined {
  for (const family of FAMILIES) {
    const key = family.keyOf(registration);
    if (key !== undefined) return key;
  }
  return undefined;
}

/** Mock accounts never reach the service: their addresses are synthetic. */
export const realAccounts = (descriptors: readonly AccountDescriptor[]) =>
  descriptors.filter(descriptor => descriptor.purpose === "account");

/** One registration per key: an EVM address shared by two networks registers once. */
function wantedRegistrations(descriptors: readonly AccountDescriptor[]) {
  const wanted = new Map<string, PortfolioRegistration>();
  for (const descriptor of realAccounts(descriptors)) {
    const registration = portfolioAccountOf(descriptor)?.registration;
    const key = registration && registrationKey(registration);
    if (registration && key) wanted.set(key, registration);
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

/** The registrations of this source's shapes that no account needs; others are not its to judge. */
export function unneededRegistrations(
  portfolio: Portfolio,
  descriptors: readonly AccountDescriptor[],
) {
  const wanted = wantedRegistrations(descriptors);
  return (portfolio.registrations ?? []).filter(entry => {
    const key = registrationKey(entry);
    return key !== undefined && !wanted.has(key);
  });
}
