import type { Balance } from "@ledgerhq/coin-module-framework/api/index";
import { getBalancesForAddresses } from "../../network";

const NATIVE_ASSET = { type: "native", name: "KAS" } as const;

/**
 * Native KAS balance for a single Kaspa address. Kaspa has no in-module token standard
 * (supportedFeatures = { send }), so the returned array always has exactly one entry.
 *
 * If the address is absent from the indexer response (pristine account), the balance
 * defaults to 0 rather than throwing.
 */
export async function getBalance(address: string): Promise<Balance[]> {
  const balances = await getBalancesForAddresses([address]);
  const match = balances.find(b => b.address === address);
  const value = BigInt(match?.balance ?? "0");

  return [{ value, asset: NATIVE_ASSET }];
}
