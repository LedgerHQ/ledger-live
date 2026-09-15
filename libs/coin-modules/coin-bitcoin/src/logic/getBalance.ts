import type { Balance } from "@ledgerhq/coin-module-framework/api/index";
import type { BitcoinContext } from "../api/config";
import { buildSyncedAccount } from "./buildAccount";

/**
 * Native BTC balance for the WHOLE account — every gap-limit-discovered address under the xpub,
 * not a single address (descriptor-model chains must answer for the whole account).
 *
 * Scope A native only; token balances are a later scope. Stateless: a fresh account is built and
 * synced on each call.
 */
export async function getBalance(
  context: BitcoinContext,
  currencyId: string,
  xpub: string,
  derivationPath: string | undefined,
): Promise<Balance[]> {
  const config = await context.config(currencyId);
  const account = await buildSyncedAccount(currencyId, xpub, derivationPath, config);
  const balance = await account.xpub.getXpubBalance();
  return [
    {
      value: BigInt(balance.toString()),
      asset: { type: "native" },
    },
  ];
}
