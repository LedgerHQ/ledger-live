import BlockstackApp from "@zondax/ledger-stacks";
import { AddressVersion } from "@stacks/transactions/dist";

import type { Resolver } from "../../hw/getAddress/types";
import { getPath, throwIfError } from "./utils";

const resolver: Resolver = async (transport, { path, verify }) => {
  const blockstack = new BlockstackApp(transport);

  const r = verify
    ? await blockstack.showAddressAndPubKey(getPath(path), AddressVersion.MainnetSingleSig)
    : await blockstack.getAddressAndPubKey(getPath(path), AddressVersion.MainnetSingleSig);

  throwIfError(r);

  return {
    path,
    address: r.address,
    publicKey: r.publicKey.toString("hex"),
  };
};

export default resolver;
