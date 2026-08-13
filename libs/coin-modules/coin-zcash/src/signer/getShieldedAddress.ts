import type { SignerContext } from "../types/signer";

export type GetShieldedAddressOptions = {
  path: string;
  display?: boolean | undefined;
};

export type GetShieldedAddressResult = {
  address: string;
};

export type GetShieldedAddressFn = (
  deviceId: string,
  options: GetShieldedAddressOptions,
) => Promise<GetShieldedAddressResult>;

const resolver = (signerContext: SignerContext): GetShieldedAddressFn => {
  return async (deviceId, { path, display }) => {
    const { address } = await signerContext(deviceId, signer =>
      signer.getShieldedAddress(path, display),
    );
    return { address };
  };
};

export default resolver;
