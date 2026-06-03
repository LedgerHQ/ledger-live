import type { AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import type { GetAddressFn } from "@ledgerhq/ledger-wallet-framework/bridge/getAddressWrapper";
import type { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import { createBridges } from "@ledgerhq/coin-tron/bridge";
import signerGetAddress from "@ledgerhq/coin-tron/signer";
import type { Transaction, TronAccount, TronSigner } from "@ledgerhq/coin-tron/types/index";
import { TRON_LOCAL_RPC } from "./fixtures";

export async function getLegacyBridges(signer: TronSigner): Promise<{
  currencyBridge: CurrencyBridge;
  accountBridge: AccountBridge<Transaction, TronAccount>;
  getAddress: GetAddressFn;
}> {
  const signerContext: SignerContext<TronSigner> = (_, fn) => fn(signer);
  const getAddress = signerGetAddress(signerContext);
  const { currencyBridge, accountBridge } = createBridges(signerContext, () => ({
    explorer: { url: TRON_LOCAL_RPC },
    status: { type: "active" as const },
  }));
  return { currencyBridge, accountBridge, getAddress };
}
