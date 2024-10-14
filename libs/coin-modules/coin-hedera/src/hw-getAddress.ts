import Hedera from "./hw-app-hedera";
import type { Resolver } from "../../hw/getAddress/types";

const resolver: Resolver = async (transport, { path }) => {
  const hedera = new Hedera(transport);
  const publicKey = await hedera.getPublicKey(path);

  return {
    path,
    // NOTE: we do not have the address, it must be entered by the user
    // NOTE: we send the publicKey through as the "address"
    //       this is the only way to pass several hard-coded "is this the right device" checks
    address: publicKey,
    publicKey,
  };
};

export default resolver;
