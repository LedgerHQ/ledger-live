import ICP from "@zondax/ledger-icp";
import { log } from "@ledgerhq/logs";

import type { Resolver } from "../../hw/getAddress/types";
import { getPath, isError } from "./utils";

const resolver: Resolver = async (transport, { path, verify }) => {
  log("debug", "start getAddress process");

  const icp = new ICP(transport);

  const r = verify
    ? await icp.showAddressAndPubKey(getPath(path))
    : await icp.getAddressAndPubKey(getPath(path));

  isError(r);

  return {
    path,
    address: r.address.toString("hex"),
    principalText: r.principalText,
    publicKey: r.publicKey.toString("hex"),
  };
};

export default resolver;
