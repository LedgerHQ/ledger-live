import { GetAddressFn } from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { GetAddressOptions } from "@ledgerhq/coin-framework/derivation";
import type { PolkadotSigner } from "../types";
import coinConfig from "../config";

const getAddress = (signerContext: SignerContext<PolkadotSigner>): GetAddressFn => {
  return async (deviceId: string, { path, verify }: GetAddressOptions) => {
    const runtimeUpgraded = coinConfig.getCoinConfig().runtimeUpgraded;
    const r = await signerContext(deviceId, signer =>
      signer.getAddress(path, 0, verify, runtimeUpgraded),
    );
    return {
      address: r.address,
      publicKey: r.pubKey,
      path,
    };
  };
};

export default getAddress;
