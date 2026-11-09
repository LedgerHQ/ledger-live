import type { TonContext } from "../config";
import { fetchAccount, fetchJettonWallets } from "../network";

/** Whether an address has a transaction, a balance or a jetton; needs no public key, unlike a sync. */
export async function exists(context: TonContext, address: string): Promise<boolean> {
  const config = await context.config();
  const account = await fetchAccount(config, address);
  if (account.last_transaction_lt !== null || BigInt(account.balance) > 0n) return true;
  const jettonWallets = await fetchJettonWallets(config, address);
  return jettonWallets.some(wallet => BigInt(wallet.balance) > 0n);
}
