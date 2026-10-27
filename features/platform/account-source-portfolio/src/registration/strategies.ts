import type {
  PortfolioRegistration,
  PortfolioRegistrationEntry,
} from "@domain/api-account-portfolio";
import type { AccountDescriptor } from "@domain/entity-account-descriptor";
import { evmRegistration } from "./evm";
import type { PortfolioRegistrationStrategy } from "./types";

/** EVM only: Solana is not implemented by the service, Bitcoin accounts cannot be told apart by xpub. */
export const PORTFOLIO_REGISTRATION_STRATEGIES: readonly PortfolioRegistrationStrategy[] = [
  evmRegistration,
];

/** The first strategy that covers the account, with its registration; undefined if none does. */
export function strategyOf(
  descriptor: AccountDescriptor,
  strategies: readonly PortfolioRegistrationStrategy[] = PORTFOLIO_REGISTRATION_STRATEGIES,
): { strategy: PortfolioRegistrationStrategy; registration: PortfolioRegistration } | undefined {
  for (const strategy of strategies) {
    const registration = strategy.register(descriptor);
    if (registration) return { strategy, registration };
  }
  return undefined;
}

/** The registration of the first strategy that covers the account; undefined if none does. */
export function registrationOf(
  descriptor: AccountDescriptor,
  strategies?: readonly PortfolioRegistrationStrategy[],
): PortfolioRegistration | undefined {
  return strategyOf(descriptor, strategies)?.registration;
}

/** What makes two registrations the same for the service: the xpub, the address, or our account id. */
export function registrationKey(
  registration: PortfolioRegistration | PortfolioRegistrationEntry,
): string | undefined {
  if ("xpub" in registration && registration.xpub) return `xpub:${registration.xpub}`;
  if ("accountId" in registration) return `account:${registration.accountId}`;
  if ("address" in registration && registration.address) {
    return `${registration.type}:${registration.address.toLowerCase()}`;
  }
  return undefined;
}
