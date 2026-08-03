import { ContactAddressValueSchema } from "@domain/entity-contact";
import { findCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { TokenCurrency } from "@domain/entity-currency-token";
import type {
  ContactsAddressValidationDependencies,
  ContactsAddressValidationPort,
  ContactsAddressValidationResult,
} from "./types";

type ResolvedCurrency = Readonly<{
  currency: CryptoCurrency | TokenCurrency;
  network: CryptoCurrency;
}>;

type ResolvedAddress =
  | Readonly<{ status: "resolved"; address: string; isDomain: boolean }>
  | Readonly<{ status: "domain_not_found" }>;

async function resolveCurrency(
  currencyId: string,
  dependencies: ContactsAddressValidationDependencies,
): Promise<ResolvedCurrency | null> {
  const cryptoCurrency = findCryptoCurrencyById(currencyId);
  if (cryptoCurrency) {
    return { currency: cryptoCurrency, network: cryptoCurrency };
  }

  const tokenCurrency = await dependencies.findTokenById(currencyId);
  if (!tokenCurrency) {
    return null;
  }

  const network = findCryptoCurrencyById(tokenCurrency.parentCurrencyId);
  return network ? { currency: tokenCurrency, network } : null;
}

async function resolveAddress(
  currency: CryptoCurrency | TokenCurrency,
  address: string,
  dependencies: ContactsAddressValidationDependencies,
): Promise<ResolvedAddress> {
  if (!dependencies.supportsDomain(currency)) {
    return { status: "resolved", address, isDomain: false };
  }

  const normalizedDomain = address.toLowerCase();
  if (!(await dependencies.isEnsDomain(normalizedDomain))) {
    return { status: "resolved", address, isDomain: false };
  }

  if (!dependencies.validateDomain(normalizedDomain)) {
    return { status: "domain_not_found" };
  }

  const resolvedAddress = await dependencies.resolveEnsDomain(normalizedDomain);
  return resolvedAddress
    ? { status: "resolved", address: resolvedAddress, isDomain: true }
    : { status: "domain_not_found" };
}

export function createContactsAddressValidationService(
  dependencies: ContactsAddressValidationDependencies,
): ContactsAddressValidationPort {
  return {
    validateAddress: async ({ currencyId, address }): Promise<ContactsAddressValidationResult> => {
      try {
        const resolvedCurrency = await resolveCurrency(currencyId, dependencies);
        if (!resolvedCurrency) {
          return { status: "unavailable" };
        }

        const resolvedAddress = await resolveAddress(
          resolvedCurrency.currency,
          address,
          dependencies,
        );
        if (resolvedAddress.status === "domain_not_found") {
          return resolvedAddress;
        }

        const isValid = await dependencies.validateNetworkAddress({
          network: resolvedCurrency.network,
          address: resolvedAddress.address,
        });
        if (!isValid) {
          return {
            status: "invalid_format",
            isDomain: resolvedAddress.isDomain,
          };
        }

        if (
          await dependencies.isAddressSanctioned(resolvedCurrency.network, resolvedAddress.address)
        ) {
          return { status: "sanctioned", isDomain: resolvedAddress.isDomain };
        }

        return {
          status: "valid",
          resolvedAddress: ContactAddressValueSchema.parse(resolvedAddress.address),
          isDomain: resolvedAddress.isDomain,
        };
      } catch {
        return { status: "unavailable" };
      }
    },
  };
}
