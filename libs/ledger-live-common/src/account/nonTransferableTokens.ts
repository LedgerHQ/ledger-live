import type { TokenCurrency } from "@domain/entity-currency-token";

/** CAL category of a token whose contract rejects every transfer. */
const NON_TRANSFERABLE_CATEGORY = "non_transferable";

export const isNonTransferableToken = (token: TokenCurrency): boolean =>
  token.categories?.includes(NON_TRANSFERABLE_CATEGORY) ?? false;
