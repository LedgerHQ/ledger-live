import type { CryptoCurrency } from "@ledgerhq/ledger-wallet-framework/types";
import { log } from "@ledgerhq/logs";
import type { SignerContext } from "../types/signer";

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
  return async (deviceId, { path }) => {
    const { viewKey } = await signerContext(deviceId, signer => signer.getFullViewingKey(path));
    log("hw", `getFullViewingKey zcash path=${path}`);
    return { viewKey, path };
  };
};

export default resolver;
