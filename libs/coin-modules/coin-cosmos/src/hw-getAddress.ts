import { GetAddressFn } from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import { GetAddressOptions } from "@ledgerhq/coin-framework/derivation";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import cryptoFactory from "./chain/chain";
import { CosmosAddress, CosmosSigner } from "./types/signer";

function resolver(signerContext: SignerContext<CosmosSigner>): GetAddressFn {
  return async (deviceId: string, { path, verify, currency }: GetAddressOptions) => {
    const cosmosApiImpl = cryptoFactory(currency.id);

    const { address, publicKey } = (await signerContext(deviceId, async signer => {
      const { address, publicKey } = await signer.getAddress(
        path,
        cosmosApiImpl.prefix,
        verify || false,
      );
      return { address, publicKey };
    })) as CosmosAddress;
    // TODO: compressed convertion like in signOperation.ts ?
    //         const pubKey = Buffer.from(compressed_pk).toString("base64");
    return {
      address,
      publicKey, //publicKey.toString("hex"),
      path,
    };
  };
}

export default resolver;
