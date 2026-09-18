import type { AddressValidationCurrencyParameters } from "@ledgerhq/coin-module-framework/api/types";
import { isValidAddress } from "@ledgerhq/wallet-btc/utils";
import type { Currency } from "@ledgerhq/wallet-btc/index";

/**
 * Validate a Bitcoin(-like) address for the currency carried in `parameters`.
 *
 * Ported from the legacy `../validateAddress.ts`. `import type { Currency }` keeps this free of
 * wallet-btc's `getWallet()` singleton side effect.
 */
export async function validateAddress(
  address: string,
  parameters: Partial<AddressValidationCurrencyParameters>,
): Promise<boolean> {
  if (!parameters.currencyId) {
    throw new Error("Missing currency parameter for address validation on Bitcoin");
  }

  try {
    // Optimistically treat parameters.currencyId as a wallet-btc Currency; isValidAddress throws
    // if it is not, in which case the address is not valid for this network.
    return isValidAddress(address, parameters.currencyId as unknown as Currency);
  } catch {
    return false;
  }
}
