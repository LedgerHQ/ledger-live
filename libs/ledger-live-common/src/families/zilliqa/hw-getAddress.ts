import Zilliqa from "@ledgerhq/hw-app-zilliqa";
import type { Resolver } from "../../hw/getAddress/types";

const resolver: Resolver = async (transport, { path, verify }) => {
  const zilliqa = new Zilliqa(transport);
  const r = await zilliqa.getAddress(path, !!verify);
  return {
    address: r.address,
    publicKey: r.publicKey,
    path,
  };
};

export default resolver;
