import type { Balance } from "@ledgerhq/coin-module-framework/api/index";
import type { TonContext } from "../config";
import { fetchAccount, fetchJettonWallets } from "../network";
import { toJettonAsset } from "./address";

/** Nothing is locked: the 0.02 TON floor is a send rule (`validateIntent`), not a reserve. */
export async function getBalance(context: TonContext, address: string): Promise<Balance[]> {
  const config = await context.config();
  const [account, jettonWallets] = await Promise.all([
    fetchAccount(config, address),
    fetchJettonWallets(config, address),
  ]);

  return [
    { value: BigInt(account.balance), asset: { type: "native" } },
    ...jettonWallets.map(wallet => ({
      value: BigInt(wallet.balance),
      asset: toJettonAsset(wallet.jetton, address),
    })),
  ];
}
