import { GetAddressFn } from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { GetAddressOptions } from "@ledgerhq/coin-framework/derivation";
import { MinaAddress, MinaSigner } from "./signer";
import { getAccountNumFromPath } from "./logic";
import invariant from "invariant";
import { log } from "@ledgerhq/logs";

const resolver = (signerContext: SignerContext<MinaSigner>): GetAddressFn => {
  return async (deviceId: string, { path }: GetAddressOptions) => {
    const account = getAccountNumFromPath(path);
    log("debug", "getAddress, extracted account for path: ", { account, path });
    invariant(account !== undefined, "Invalid account path, supported: 44'/12586'/<account>'/0/0");
    const r = (await signerContext(deviceId, signer => signer.getAddress(account))) as MinaAddress;
    return {
      address: r.publicKey,
      publicKey: r.publicKey,
      path,
    };
  };
};

export default resolver;
