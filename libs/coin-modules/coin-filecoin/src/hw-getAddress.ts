import Fil from "@zondax/ledger-filecoin";
import { log } from "@ledgerhq/logs";

import type { Resolver } from "../../hw/getAddress/types";
import { getPath, isError } from "./utils";

const resolver: Resolver = async (transport, { path, verify }) => {
  log("debug", "start getAddress process");

  const fil = new Fil(transport);

  const r = verify
    ? await fil.showAddressAndPubKey(getPath(path))
    : await fil.getAddressAndPubKey(getPath(path));

  isError(r);

  return {
    path,
    address: r.addrString,
    publicKey: r.compressed_pk.toString("hex"),
  };
};

export default resolver;
