import Avalanche from "./hw-app-avalanche";
import type { Resolver } from "../../hw/getAddress/types";

const resolver: Resolver = async (transport, { path }) => {
  const avalanche = new Avalanche(transport);
  const { address, publicKey, chainCode } = await avalanche.getAddress(path);

  return {
    path,
    address,
    publicKey,
    chainCode,
  };
};

export default resolver;
