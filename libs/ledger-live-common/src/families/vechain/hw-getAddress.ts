import Vet from "@ledgerhq/hw-app-vet";
import eip55 from "eip55";
import type { Resolver } from "../../hw/getAddress/types";

const resolver: Resolver = async (transport, { path, verify, askChainCode }) => {
  const vet = new Vet(transport);
  const r = await vet.getAddress(path, verify, askChainCode || false);
  const address = eip55.encode(r.address);
  return {
    path,
    address,
    publicKey: r.publicKey,
    chainCode: r.chainCode,
  };
};

export default resolver;
