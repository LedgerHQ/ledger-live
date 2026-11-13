import type { PortfolioRegistration } from "@domain/api-account-portfolio";
import type { AccountDescriptor } from "@domain/entity-account-descriptor";

/** How the service tracks one of our accounts. */
export type PortfolioAccountRef = {
  readonly registration: PortfolioRegistration;
  /** The id the service lists the account under and reads it by. */
  readonly serverAccountId: string;
};

/** A registration as we send it or as the service lists it. */
export type RegistrationLike = {
  readonly type: string;
  readonly address?: string | null;
  readonly network?: string | null;
  readonly xpub?: string | null;
  readonly addresses?: readonly string[] | null;
};

/** One registration shape of the service, and the accounts registered with it. */
export type PortfolioFamily = {
  /** Undefined for an account this family does not register. */
  accountOf(descriptor: AccountDescriptor): PortfolioAccountRef | undefined;
  /** Matches a registration with a listed one; undefined for one this family never sends. */
  keyOf(registration: RegistrationLike): string | undefined;
};
