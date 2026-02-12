import { GetAddressFn } from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import { GetAddressOptions } from "@ledgerhq/coin-framework/derivation";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { UserRefusedAddress } from "@ledgerhq/errors";
import invariant from "invariant";
import { getAccountNumFromPath } from "../common-logic";
import { MinaSigner } from "../types/signer";

const USER_REFUSED_ACTION = "27013";

const resolver = (signerContext: SignerContext<MinaSigner>): GetAddressFn => {
  return async (deviceId: string, { path, verify }: GetAddressOptions) => {
    const account = getAccountNumFromPath(path);
    invariant(account !== undefined, "Invalid account path, supported: 44'/12586'/<account>'/0/0");
    const r = await signerContext(deviceId, signer => signer.getAddress(account, verify || false));

    if (r.returnCode === USER_REFUSED_ACTION) {
      throw new UserRefusedAddress();
    }
    invariant(r.publicKey, "[mina] getAddress: expected publicKey to be defined");
    return {
      address: r.publicKey,
      publicKey: r.publicKey,
      path,
    };
  };
};

export default resolver;
