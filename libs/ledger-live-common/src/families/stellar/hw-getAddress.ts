import Stellar from "@ledgerhq/hw-app-str";
import type { Resolver } from "../../hw/getAddress/types";
import { StrKey } from "@stellar/stellar-sdk";

const resolver: Resolver = async (transport, { path, verify }) => {
  const stellar = new Stellar(transport);
  const { rawPublicKey } = await stellar.getPublicKey(path, verify);
  const publicKey = StrKey.encodeEd25519PublicKey(rawPublicKey);
  return {
    path,
    address: publicKey,
    publicKey: rawPublicKey.toString("hex"),
  };
};

export default resolver;
