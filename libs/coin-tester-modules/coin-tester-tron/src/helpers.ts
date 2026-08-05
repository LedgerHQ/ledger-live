import type { AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import type { GetAddressFn } from "@ledgerhq/ledger-wallet-framework/bridge/getAddressWrapper";
import type { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import type { TronSigner } from "@ledgerhq/coin-tron/types/index";
import { getCoinFrameworkCurrencyBridge } from "@ledgerhq/live-common/bridge/generic-coin-framework/currencyBridge";
import { getCoinFrameworkAccountBridge } from "@ledgerhq/live-common/bridge/generic-coin-framework/accountBridge";
import type {
  GenericTransaction,
  LegacySigner,
} from "@ledgerhq/live-common/bridge/generic-coin-framework/types";
import { registerCoinModules } from "@ledgerhq/live-common/coin-modules/registry";
import { coinModuleLoaders } from "@ledgerhq/live-common/coin-modules/loaders";

registerCoinModules(coinModuleLoaders);

// The generic coin framework signs through `signer.signTransaction(path, rawTxHex, options)`, while
// the device-facing TronSigner exposes `sign(path, rawTxHex, tokenSignatures)` — so the adapter
// forwards `options.token`'s CAL signature when one is supplied, as the shipping signer
// (`ledger-live-common/src/families/tron/signer.ts`) does. In this tester it never is: the software
// signer has no device to clear-sign for, so no token here carries a `ledgerSignature`.
type TronFrameworkSigner = LegacySigner & {
  getAddress: (path: string) => Promise<{ address: string; publicKey: string }>;
};

export async function getBridges(signer: TronSigner): Promise<{
  currencyBridge: CurrencyBridge;
  accountBridge: AccountBridge<GenericTransaction>;
}> {
  const frameworkSigner: TronFrameworkSigner = {
    getAddress: path => signer.getAddress(path),
    signTransaction: (
      path: string,
      rawTxHex: string,
      options?: { token?: { ledgerSignature?: string } },
    ) =>
      signer.sign(
        path,
        rawTxHex,
        options?.token?.ledgerSignature ? [options.token.ledgerSignature] : [],
      ),
  };
  const context: SignerContext<TronFrameworkSigner> = (_, fn) => fn(frameworkSigner);
  const getAddress: GetAddressFn = async (deviceId, opts) => {
    const { address, publicKey } = await context(deviceId, s => s.getAddress(opts.path));
    return { address, publicKey, path: opts.path };
  };

  return {
    currencyBridge: await getCoinFrameworkCurrencyBridge("tron", "local", { context, getAddress }),
    accountBridge: await getCoinFrameworkAccountBridge("tron", "local", { context, getAddress }),
  };
}
