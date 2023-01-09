import Zilliqa from "@ledgerhq/hw-app-zilliqa";
import type { Resolver } from "../../hw/getAddress/types";

const resolver: Resolver = async (transport, { path /*, verify */ }) => {
  // TODO: Check in the hardware implementation whether we can add support for
  // verify
  const zilliqa = new Zilliqa(transport);
  const r = await zilliqa.getAddress(path);

  return {
    address: r.address,
    publicKey: r.publicKey,
    path,
  };
};

export default resolver;
