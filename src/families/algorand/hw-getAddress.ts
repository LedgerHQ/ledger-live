import Algorand from "@ledgerhq/hw-app-algorand";
import type { Resolver } from "../../hw/getAddress/types";
import { withLibcore } from "../../libcore/access";

const convertPubkeyToAddress = async (pubkey) => {
  return await withLibcore(async (core) => {
    const address = await core.AlgorandAddress.fromPublicKey(pubkey);
    return address;
  });
};

const resolver: Resolver = async (transport, { path, verify }) => {
  const algorand = new Algorand(transport);
  const r = await algorand.getAddress(path, verify || false);
  const address = await convertPubkeyToAddress(r.publicKey);
  return {
    address: address,
    publicKey: r.publicKey,
    path,
  };
};

export default resolver;
