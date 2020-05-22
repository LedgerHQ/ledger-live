// @flow

import type { Resolver } from "../../hw/getAddress/types";
import CosmosApp from "./app";
import BIPPath from "bip32-path";

const resolver: Resolver = async (transport, { path, verify }) => {
  const cosmos = new CosmosApp(transport);
  const bipPath = BIPPath.fromString(path).toPathArray();

  const r = await cosmos.getAddressAndPubKey(
    bipPath,
    "cosmos",
    verify || false
  );
  return {
    address: r.bech32_address,
    publicKey: r.compressed_pk.toString("hex"),
    path,
  };
};

export default resolver;
