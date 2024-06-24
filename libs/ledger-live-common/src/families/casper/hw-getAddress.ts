import Casper from "@zondax/ledger-casper";
import { log } from "@ledgerhq/logs";

import type { Resolver } from "../../hw/getAddress/types";
import { getPath, isError } from "./msc-utils";
import { casperAddressFromPubKey } from "./bridge/bridgeHelpers/addresses";
import { CLPublicKeyTag } from "casper-js-sdk";

const resolver: Resolver = async (transport, { path, verify }) => {
  log("debug", "start getAddress process");

  const casper = new Casper(transport);

  const response = verify
    ? await casper.showAddressAndPubKey(getPath(path))
    : await casper.getAddressAndPubKey(getPath(path));

  isError(response);

  const { Address, publicKey } = response;
  return {
    path,
    address: Address.length
      ? Address.toString().toLowerCase()
      : casperAddressFromPubKey(publicKey, CLPublicKeyTag.SECP256K1),
    publicKey: publicKey.toString("hex"),
  };
};

export default resolver;
