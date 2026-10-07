import type { Balance } from "@ledgerhq/coin-module-framework/api/types";
import type { BitcoinContext } from "../config";
import { fetchAddressBalance } from "../network/explorer";

/**
 * Confirmed native balance of a single address (`address/{a}/balance`). Unconfirmed transactions
 * are not counted, as in the other coin modules.
 */
export async function getBalance(
  context: BitcoinContext,
  currencyId: string,
  address: string,
): Promise<Balance[]> {
  const config = await context.config(currencyId);
  const value = await fetchAddressBalance(config, currencyId, address);
  return [{ value, asset: { type: "native" } }];
}
