import Neo from "./hw-app-neo";
import type { Resolver } from "../../hw/getAddress/types";

const resolver: Resolver = async (transport, { path }) => {
  const neo = new Neo(transport);
  const r = await neo.getAddress(path);
  return {
    path,
    address: r.address,
    publicKey: r.publicKey,
  };
};

export default resolver;
