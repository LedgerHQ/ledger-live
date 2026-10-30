import type { PortfolioRegistration } from "@domain/api-account-portfolio";
import type { AccountDescriptor } from "@domain/entity-account-descriptor";
import { bitcoinRegistration } from "./bitcoin";
import { evmRegistration } from "./evm";
import type { PortfolioRegistrationStrategy } from "./types";

export type { PortfolioRegistrationStrategy } from "./types";

/**
 * The families registered for now. Solana is not on the list: the service answers 400 "not yet
 * implemented", which would reject the whole body. Add a family by adding its strategy here.
 */
export const PORTFOLIO_REGISTRATION_STRATEGIES: readonly PortfolioRegistrationStrategy[] = [
  bitcoinRegistration,
  evmRegistration,
];

/** The registration of the first strategy that covers the account; undefined if none does. */
export function registrationOf(
  descriptor: AccountDescriptor,
  strategies: readonly PortfolioRegistrationStrategy[] = PORTFOLIO_REGISTRATION_STRATEGIES,
): PortfolioRegistration | undefined {
  for (const strategy of strategies) {
    const registration = strategy.register(descriptor);
    if (registration) return registration;
  }
  return undefined;
}
