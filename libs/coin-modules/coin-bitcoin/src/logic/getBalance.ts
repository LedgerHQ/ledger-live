import type { Balance } from "@ledgerhq/coin-module-framework/api/index";
import type { BitcoinContext } from "../api/config";
import { buildSyncedAccount } from "./buildAccount";

/**
 * Native BTC balance for the WHOLE account — every gap-limit-discovered address under the xpub,
 * not a single address (descriptor-model chains must answer for the whole account).
 *
 * Uses wallet-btc's `getXpubBalance` (sum of the account's unspent UTXOs across all derived
 * addresses). This counts CONFIRMED **and** pending (0-conf) unspent outputs — the wallet's
 * spendable view — which is what the send flow and the coin-tester expect.
 *
 * NOTE: a batched `atlas_getBalance` variant (discover addresses + sum per-address balances, no
 * history fetch) was prototyped and is much cheaper (~6 requests vs the full sync's ~561, no tx
 * download). It was reverted because `atlas_getBalance` / `address/{a}/balance` is CONFIRMED-ONLY,
 * so it under-reports a freshly-received (0-conf) balance and broke the generic-adapter coin-tester
 * with `NotEnoughBalance`. Re-adopting it needs a mempool-aware sum (confirmed + pending) verified
 * against the regtest explorer.
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
