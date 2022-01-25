import Cosmos from "@ledgerhq/hw-app-cosmos";
import type { Resolver } from "../../hw/getAddress/types";
import { isTestNet } from "./logic";

const resolver: Resolver = async (transport, { path, verify, currency }) => {
  const cosmos = new Cosmos(transport);
  const cointype = isTestNet(currency.id) ? "tcro" : "cro";
  const r = await cosmos.getAddress(path, cointype, verify || false);
  return {
    address: r.address,
    publicKey: r.publicKey,
    path,
  };
};

export default resolver;
