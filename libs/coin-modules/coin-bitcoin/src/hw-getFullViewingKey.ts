import type { CryptoCurrency } from "@ledgerhq/ledger-wallet-framework/types";
import type { SignerContext } from "./signer";
import { getChainAdapter } from "./chain-adapters/registry";
import type { Logger } from "@ledgerhq/coin-module-framework/config";

export type GetFullViewingKeyOptions = {
  currency: CryptoCurrency;
  path: string;
};

export type GetFullViewingKeyResult = {
  viewKey: string;
  path: string;
};

export type GetFullViewingKeyFn = (
  deviceId: string,
  options: GetFullViewingKeyOptions,
) => Promise<GetFullViewingKeyResult>;

const resolver = (signerContext: SignerContext, logger: Logger): GetFullViewingKeyFn => {
  return async (deviceId, { currency, path }) => {
    const adapter = getChainAdapter(currency.id);
    const custom = adapter.getFullViewingKey?.(deviceId, currency, path, signerContext);
    if (!custom) {
      throw new Error(`${currency.id} does not support full viewing key export`);
    }

    const viewKey = await custom;
    logger("hw", `getFullViewingKey ${currency.id} path=${path}`);
    return {
      viewKey,
      path,
    };
  };
};

export default resolver;
