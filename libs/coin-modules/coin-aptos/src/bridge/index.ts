import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { CoinConfig } from "@ledgerhq/coin-framework/config";
import { Bridge } from "@ledgerhq/types-live";
import { AptosSigner, Transaction } from "../types";
import aptosCoinConfig, { type AptosCoinConfig } from "../config";
import { buildCurrencyBridge, buildAccountBridge } from "../logic";
export type { AptosCoinConfig } from "../config";

export function createBridges(
  signerContext: SignerContext<AptosSigner>,
  coinConfig: CoinConfig<AptosCoinConfig>,
): Bridge<Transaction> {
  aptosCoinConfig.setCoinConfig(coinConfig);

  return {
    currencyBridge: buildCurrencyBridge(signerContext),
    accountBridge: buildAccountBridge(signerContext),
  };
}
