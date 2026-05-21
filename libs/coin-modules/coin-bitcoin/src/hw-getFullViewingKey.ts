import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { log } from "@ledgerhq/logs";
import type { SignerContext } from "./signer";
import { getChainAdapter } from "./chain-adapters/registry";

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

const resolver = (signerContext: SignerContext): GetFullViewingKeyFn => {
  return async (deviceId, { currency, path }) => {
    const adapter = getChainAdapter(currency.id);
    const custom = adapter.getFullViewingKey?.(deviceId, currency, path, signerContext);
    if (!custom) {
      throw new Error(`${currency.id} does not support full viewing key export`);
    }

    const viewKey = await custom;
    log("hw", `getFullViewingKey ${currency.id} path=${path}`);
    return {
      viewKey,
      path,
    };
  };
};

export default resolver;
