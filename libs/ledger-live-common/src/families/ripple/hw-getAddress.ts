import Xrp from "@ledgerhq/hw-app-xrp";
import type { Resolver } from "../../hw/getAddress/types";
import { normalizeXrplProtocolPath } from "@ledgerhq/hw-app-xah";

const resolver: Resolver = async (transport, { path, verify, askChainCode }) => {
  const xrp = new Xrp(transport);
  const { address, publicKey, chainCode } = await xrp.getAddress(
    normalizeXrplProtocolPath(path),
    verify,
    askChainCode || false,
  );
  return {
    path: normalizeXrplProtocolPath(path),
    address,
    publicKey,
    chainCode,
  };
};

export default resolver;
