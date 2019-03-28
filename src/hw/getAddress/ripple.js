// @flow

import Xrp from "@ledgerhq/hw-app-xrp";
import type { Resolver } from "./types";

const resolver: Resolver = async (transport, { path, verify }) => {
  const xrp = new Xrp(transport);
  const { address, publicKey } = await xrp.getAddress(path, verify);
  return { path, address, publicKey };
};

export default resolver;
