import type { GetAddressOptions } from "@ledgerhq/ledger-wallet-framework/derivation";
import type { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import type { AleoSigner } from "../types";

export type GetViewKeyOptions = Pick<GetAddressOptions, "path" | "currency">;
export type GetViewKeyResult = {
  path: string;
  viewKey: string;
};
export type GetViewKeyFn = (
  deviceId: string,
  viewKeyOpt: GetViewKeyOptions,
) => Promise<GetViewKeyResult>;

const getViewKey = (signerContext: SignerContext<AleoSigner>): GetViewKeyFn => {
  return async (deviceId: string, { path }: GetViewKeyOptions) => {
    const result = await signerContext(deviceId, signer => signer.getViewKey(path));

    return {
      path,
      viewKey: result.viewKey,
    };
  };
};

export default getViewKey;
