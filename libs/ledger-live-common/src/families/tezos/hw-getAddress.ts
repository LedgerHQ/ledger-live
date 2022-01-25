import Xtz from "@ledgerhq/hw-app-tezos";
import type { Resolver } from "../../hw/getAddress/types";

const resolver: Resolver = async (transport, { path, verify }) => {
  const xtz = new Xtz(transport);
  const r = await xtz.getAddress(path, { verify });
  return { ...r, path };
};

export default resolver;
