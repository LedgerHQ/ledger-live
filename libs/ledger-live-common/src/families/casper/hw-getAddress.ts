import Capser from "@zondax/ledger-casper";
import { log } from "@ledgerhq/logs";

import type { Resolver } from "../../hw/getAddress/types";
import { getPath, isError } from "./utils";

const resolver: Resolver = async (transport, { path, verify }) => {
  log("debug", "start getAddress process");

  const casper = new Capser(transport);

  const r = verify
    ? await casper.showAddressAndPubKey(getPath(path))
    : await casper.getAddressAndPubKey(getPath(path));

  isError(r);

  return {
    path,
    address: r.Address.toString(),
    publicKey: r.publicKey.toString("hex"),
  };
};

export default resolver;
