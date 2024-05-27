import { utils as TyphonUtils } from "@stricahq/typhonjs";
import { address as TyphonAddress } from "@stricahq/typhonjs";
import { GetAddressFn } from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { GetAddressOptions } from "@ledgerhq/coin-framework/derivation";
import { getBipPathFromString, getBipPathString } from "./logic";
import { StakeChain } from "./types";
import { STAKING_ADDRESS_INDEX } from "./constants";
import { getNetworkParameters } from "./networks";
import { CardanoSigner } from "./signer";

const resolver = (signerContext: SignerContext<CardanoSigner>): GetAddressFn => {
  return async (deviceId: string, { path, verify, currency }: GetAddressOptions) => {
    const spendingPath = getBipPathFromString(path);
    const stakingPathString = getBipPathString({
      account: spendingPath.account,
      chain: StakeChain.stake,
      index: STAKING_ADDRESS_INDEX,
    });
    const networkParams = getNetworkParameters(currency.id);

    const r = await signerContext(deviceId, signer =>
      signer.getAddress({ path, stakingPathString, networkParams, verify }),
    );

    const address = TyphonUtils.getAddressFromHex(r.addressHex) as TyphonAddress.BaseAddress;

    return {
      address: address.getBech32(),
      // Here, we use publicKey hash, as cardano app doesn't export the public key
      publicKey: address.paymentCredential.hash,
      path,
    };
  };
};

export default resolver;
