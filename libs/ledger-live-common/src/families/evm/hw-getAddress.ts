import type { Resolver } from "../../hw/getAddress/types";
import eip55 from "eip55";
import Eth from "@ledgerhq/hw-app-eth";

/**
 * Eth app binding request for the address
 */
const getAddress: Resolver = async (transport, { path, verify }) => {
  const ethBindings = new Eth(transport);
  const { address, publicKey, chainCode } = await ethBindings.getAddress(
    path,
    verify,
    false
  );

  return {
    address: eip55.encode(address),
    publicKey,
    chainCode,
    path,
  };
};

export default getAddress;
