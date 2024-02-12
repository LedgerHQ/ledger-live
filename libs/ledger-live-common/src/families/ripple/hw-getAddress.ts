import Xrp from "@ledgerhq/hw-app-xrp";
import type { Resolver } from "../../hw/getAddress/types";

const resolver: Resolver = async (transport, { path, verify, askChainCode }) => {
  const xrp = new Xrp(transport);
  const { address, publicKey, chainCode } = await xrp.getAddress(
    path,
    verify,
    askChainCode || false,
  );
  return {
    path,
    address,
    publicKey,
    chainCode,
  };
};

export default resolver;
