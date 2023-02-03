import type { Resolver } from "../../hw/getAddress/types";
import AvalancheApp from "@avalabs/hw-app-avalanche";

const resolver: Resolver = async (transport, { path }) => {
  const avalanche = new AvalancheApp(transport);

  const { publicKey, chain_code } = await avalanche.getExtendedPubKey(
    path,
    false
  );

  return {
    path,
    address: "",
    publicKey: publicKey?.toString("hex"),
    chainCode: chain_code?.toString("hex"),
  };
};

export default resolver;
