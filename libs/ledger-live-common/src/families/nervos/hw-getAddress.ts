import type { GetAddressOptions, Resolver } from "../../hw/getAddress/types";
import Nervos from "@ledgerhq/hw-app-nervos";

const resolver: Resolver = async (
  transport,
  { path, verify }: GetAddressOptions
) => {
  const nervos = new Nervos(transport);

  const r = await nervos.getAddress(path, { verify });

  return {
    address: r.address,
    publicKey: r.publicKey,
    path,
  };
};

export default resolver;
