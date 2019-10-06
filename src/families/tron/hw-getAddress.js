// @flow

import Trx from "./hw-app-trx";
import type { Resolver } from "../../hw/getAddress/types";

const resolver: Resolver = async (
  transport,
  { path, verify, askChainCode }
) => {
  const trx = new Trx(transport);
  const r = await trx.getAddress(path, verify, askChainCode || false);
  return {
    path,
    address: r.address,
    publicKey: r.publicKey.toString("hex"),
    chainCode: r.chainCode
  };
};

export default resolver;
