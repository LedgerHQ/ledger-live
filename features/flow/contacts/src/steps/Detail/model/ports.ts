import type { ContactAddress } from "@domain/entity-contact";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";

/** Injected by app wiring; aligns with the future @features/platform-contacts contract. */
export type ContactAddressCurrencyPort = Readonly<{
  resolveNetworkId(currencyId: ContactAddress["currencyId"]): CryptoCurrency["id"] | undefined;
}>;
