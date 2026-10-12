import type { AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import type { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import type { GetAddressFn } from "@ledgerhq/ledger-wallet-framework/bridge/getAddressWrapper";
import { getCoinFrameworkCurrencyBridge } from "@ledgerhq/live-common/bridge/generic-coin-framework/currencyBridge";
import { getCoinFrameworkAccountBridge } from "@ledgerhq/live-common/bridge/generic-coin-framework/accountBridge";
import { registerCoinModules } from "@ledgerhq/live-common/coin-modules/registry";
import { coinModuleLoaders } from "@ledgerhq/live-common/coin-modules/loaders";
import { resolver, type BitcoinDeviceSigner } from "@ledgerhq/live-common/families/bitcoin/signer";
import type { BitcoinAccount, Transaction } from "@ledgerhq/live-common/families/bitcoin/types";

registerCoinModules(coinModuleLoaders);

/**
 * The bitcoin family's bridges on the generic coin framework (ADR-065), the ones Ledger Wallet
 * runs, with `signer` in place of the device.
 */
export async function getBridges(signer: BitcoinDeviceSigner): Promise<{
  currencyBridge: CurrencyBridge;
  accountBridge: AccountBridge<Transaction, BitcoinAccount>;
  signerContext: SignerContext<BitcoinDeviceSigner>;
  getAddress: GetAddressFn;
}> {
  const signerContext: SignerContext<BitcoinDeviceSigner> = (_, fn) => fn(signer);
  const getAddress = resolver(signerContext);
  const customSigner = { context: signerContext, getAddress };

  return {
    currencyBridge: await getCoinFrameworkCurrencyBridge("bitcoin", "local", customSigner),
    // typed on GenericTransaction, of which the bitcoin transaction is the family's shape
    accountBridge: (await getCoinFrameworkAccountBridge(
      "bitcoin",
      "local",
      customSigner,
    )) as unknown as AccountBridge<Transaction, BitcoinAccount>,
    signerContext,
    getAddress,
  };
}
