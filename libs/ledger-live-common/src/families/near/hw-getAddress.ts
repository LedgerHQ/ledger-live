import type { Resolver } from "../../hw/getAddress/types";

import Near from "@ledgerhq/hw-app-near";

const resolver: Resolver = async (transport, { path, verify }) => {
  const near = new Near(transport);

  const r = await near.getAddress(path, verify);

  return {
    address: r.address,
    publicKey: r.publicKey,
    path,
  };
};

export default resolver;
