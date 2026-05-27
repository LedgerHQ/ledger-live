import type { AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import type { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import { createBridges } from "@ledgerhq/coin-filecoin";
import type { FilecoinSigner, Transaction } from "@ledgerhq/coin-filecoin/types";

export function getBridges(signer: FilecoinSigner): {
  currencyBridge: CurrencyBridge;
  accountBridge: AccountBridge<Transaction>;
} {
  const signerContext: SignerContext<FilecoinSigner> = (_deviceId, fn) => fn(signer);

  return createBridges(signerContext);
}
