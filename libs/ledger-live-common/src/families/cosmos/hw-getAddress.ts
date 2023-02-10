import Cosmos from "@ledgerhq/hw-app-cosmos";
import type { Resolver } from "../../hw/getAddress/types";

const resolver: Resolver = async (transport, { path, verify, currency }) => {
  const cosmos = new Cosmos(transport);
  const r = await cosmos.getAddress(path, currency.id, verify || false);
  return {
    address: r.address,
    publicKey: r.publicKey,
    path,
  };
};

export default resolver;
