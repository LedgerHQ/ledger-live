import type { GetAddressOptions } from "@ledgerhq/coin-framework/derivation";
import type { SignerContext } from "@ledgerhq/coin-framework/signer";
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
  return async (deviceId: string, opts: GetViewKeyOptions) => {
    const viewKey = await signerContext(deviceId, signer => signer.getViewKey(opts.path));

    return {
      path: opts.path,
      viewKey: viewKey.toString(),
    };
  };
};

export default getViewKey;
