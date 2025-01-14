import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { CurrencyBridge } from "@ledgerhq/types-live";
import { AptosSigner } from "../types";
import { hydrate, preload, scanAccounts } from "../logic";
export type { AptosCoinConfig } from "../config";

export function buildCurrencyBridge(signerContext: SignerContext<AptosSigner>): CurrencyBridge {
  return {
    preload,
    hydrate,
    scanAccounts: scanAccounts(signerContext),
  };
}
