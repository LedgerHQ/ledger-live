import { GetAddressFn } from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { GetAddressOptions } from "@ledgerhq/coin-framework/derivation";
import { getBipPathFromString, getBipPathString } from "./logic";
import { StakeChain } from "./types";
import { STAKING_ADDRESS_INDEX } from "./constants";
import { getNetworkParameters } from "./networks";
import {
  CardanoAddress,
  CardanoExtendedPublicKey,
  CardanoSignature,
  CardanoSigner,
} from "./signer";

const resolver = (
  signerContext: SignerContext<
    CardanoSigner,
    CardanoAddress | CardanoExtendedPublicKey | CardanoSignature
  >,
): GetAddressFn => {
  return async (deviceId: string, { path, verify, currency }: GetAddressOptions) => {
    const spendingPath = getBipPathFromString(path);
    const stakingPathString = getBipPathString({
      account: spendingPath.account,
      chain: StakeChain.stake,
      index: STAKING_ADDRESS_INDEX,
    });
    const networkParams = getNetworkParameters(currency.id);

    const r = (await signerContext(deviceId, signer =>
      signer.getAddress({ path, stakingPathString, networkParams, verify }),
    )) as CardanoAddress;
    return {
      address: r.address,
      publicKey: r.publicKey,
      path,
    };
  };
};

export default resolver;
