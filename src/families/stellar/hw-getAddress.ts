import Stellar from "@ledgerhq/hw-app-str";
import type { Resolver } from "../../hw/getAddress/types";

const resolver: Resolver = async (transport, { path, verify }) => {
  const stellar = new Stellar(transport);
  const r = await stellar.getPublicKey(path, false, verify);
  return {
    path,
    address: r.publicKey,
    publicKey: r.raw.toString("hex"),
  };
};

export default resolver;
