import Cosmos from "@ledgerhq/hw-app-cosmos";
import type { Resolver } from "../../hw/getAddress/types";
import cryptoFactory from "./chain/chain";

const resolver: Resolver = async (transport, { path, verify, currency }) => {
  const cosmosApiImpl = cryptoFactory(currency.id);
  const cosmos = new Cosmos(transport);
  const r = await cosmos.getAddress(
    path,
    cosmosApiImpl.prefix,
    verify || false
  );
  return {
    address: r.address,
    publicKey: r.publicKey,
    path,
  };
};

export default resolver;
