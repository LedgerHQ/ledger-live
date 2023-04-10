import Aptos from "./hw-app-aptos";
import type { Resolver } from "../../hw/getAddress/types";

const resolver: Resolver = async (transport, { path, verify }) => {
  const aptos = new Aptos(transport);

  const r = await aptos.getAddress(path, verify || false);

  return {
    address: r.address,
    publicKey: r.publicKey.toString("hex"),
    path,
  };
};

export default resolver;
