import type { Resolver } from "../../hw/getAddress/types";
import Nervos from "@ledgerhq/hw-app-nervos";

const resolver: Resolver = async (transport, { path }) => {
  const nervos = new Nervos(transport);

  const r = await nervos.getAddress(path);

  return {
    address: r.address,
    publicKey: r.publicKey,
    path,
  };
};

export default resolver;
