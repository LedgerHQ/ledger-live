import Casper from "@zondax/ledger-casper";
import { log } from "@ledgerhq/logs";

import type { Resolver } from "../../hw/getAddress/types";
import { getPath, isError } from "./msc-utils";
import { casperAddressFromPubKey } from "./bridge/bridgeHelpers/addresses";

const resolver: Resolver = async (transport, { path, verify }) => {
  log("debug", "start getAddress process");

  const casper = new Casper(transport);

  const r = verify
    ? await casper.showAddressAndPubKey(getPath(path))
    : await casper.getAddressAndPubKey(getPath(path));

  isError(r);

  return {
    path,
    address: r.Address.length ? r.Address.toString() : casperAddressFromPubKey(r.publicKey),
    publicKey: r.publicKey.toString("hex"),
  };
};

export default resolver;
