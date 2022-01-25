import type { Resolver } from "../../hw/getAddress/types";
import Elrond from "./hw-app-elrond";

const resolver: Resolver = async (transport, { path, verify }) => {
  const elrond = new Elrond(transport);
  const { address } = await elrond.getAddress(path, verify);
  return {
    address,
    path,
    publicKey: "",
  };
};

export default resolver;
