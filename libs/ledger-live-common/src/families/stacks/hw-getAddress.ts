import BlockstackApp from "@zondax/ledger-stacks";
import { AddressVersion } from "@stacks/transactions/dist";
import { log } from "@ledgerhq/logs";

import type { Resolver } from "../../hw/getAddress/types";
import { getPath, isError } from "./utils";

const resolver: Resolver = async (transport, { path, verify }) => {
  log("debug", "start getAddress process");

  const blockstack = new BlockstackApp(transport);

  const r = verify
    ? await blockstack.showAddressAndPubKey(
        getPath(path),
        AddressVersion.MainnetSingleSig
      )
    : await blockstack.getAddressAndPubKey(
        getPath(path),
        AddressVersion.MainnetSingleSig
      );

  isError(r);

  return {
    path,
    address: r.address,
    publicKey: r.publicKey.toString("hex"),
  };
};

export default resolver;
