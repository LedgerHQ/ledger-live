import type { PortfolioRegistration, PortfolioRegistrationEntry } from "../types";

const HEX_ADDRESS = /^0x[0-9a-fA-F]+$/;

/** Hexadecimal addresses compare case-insensitively: the service may echo another checksum case. */
const addressKey = (address: string) =>
  `address:${HEX_ADDRESS.test(address) ? address.toLowerCase() : address}`;

/**
 * What identifies a registration, whether sent or listed by the service. Undefined when the entry
 * does not carry enough to tell: such an entry is never matched, so never removed.
 */
export function registrationKey(
  registration: PortfolioRegistration | PortfolioRegistrationEntry,
): string | undefined {
  if ("xpub" in registration && registration.xpub) return `xpub:${registration.xpub}`;
  if ("addresses" in registration) {
    return `addresses:${registration.network}:${registration.addresses.join(",")}`;
  }
  if ("address" in registration && registration.address) return addressKey(registration.address);
  return undefined;
}

export type RegistrationPlan = {
  readonly toAdd: PortfolioRegistration[];
  /** Ids, as the portfolio lists them, of the registrations no wallet account backs anymore. */
  readonly toRemove: string[];
};

/** What to send so that the portfolio registers exactly the wanted accounts. */
export function planRegistrations(
  existing: readonly PortfolioRegistrationEntry[],
  wanted: readonly PortfolioRegistration[],
): RegistrationPlan {
  const wantedKeys = new Set(wanted.flatMap(registration => registrationKey(registration) ?? []));
  const existingKeys = new Set<string>();
  const toRemove: string[] = [];
  for (const entry of existing) {
    const key = registrationKey(entry);
    if (key === undefined) continue;
    existingKeys.add(key);
    if (!wantedKeys.has(key)) toRemove.push(entry.id);
  }
  const toAdd = wanted.filter(registration => {
    const key = registrationKey(registration);
    return key === undefined || !existingKeys.has(key);
  });
  return { toAdd, toRemove };
}
