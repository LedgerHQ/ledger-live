import eip55 from "eip55";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { GetAddressOptions } from "@ledgerhq/coin-framework/derivation";
import { GetAddressFn } from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import { EvmAddress, EvmSignature, EvmSigner } from "./types/signer";

const resolver = (
  signerContext: SignerContext<EvmSigner, EvmAddress | EvmSignature>,
): GetAddressFn => {
  return async (deviceId: string, { path, verify }: GetAddressOptions) => {
    const { address, publicKey, chainCode } = (await signerContext(deviceId, signer =>
      signer.getAddress(path, verify, false),
    )) as EvmAddress;
    return {
      address: eip55.encode(address),
      publicKey,
      chainCode,
      path,
    };
  };
};

export default resolver;
