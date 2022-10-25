import Icon from "@ledgerhq/hw-app-icon";
import type { Resolver } from "../../hw/getAddress/types";

const resolver: Resolver = async (transport, { path, verify }) => {
  const icon = new Icon(transport);
  const r = await icon.getAddress(path, verify);
  return {
    address: r.address,
    publicKey: r.publicKey,
    path,
  };
};

export default resolver;
