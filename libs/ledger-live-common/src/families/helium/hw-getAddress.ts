import type { Resolver } from "../../hw/getAddress/types";
import Helium from "@ledgerhq/hw-app-helium";

const resolver: Resolver = async (transport, { path, verify }) => {
  const helium = new Helium(transport);

  const split = path.split("/");
  const index = split[2].replace("'", "");

  const { address, publicKey } = await helium.getAddress(
    path,
    verify,
    Number(index)
  );

  return {
    address,
    publicKey,
    path,
  };
};

export default resolver;
