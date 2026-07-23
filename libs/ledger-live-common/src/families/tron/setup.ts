// Goal of this file is to inject all necessary device/signer dependency to coin-modules
import tronResolver from "@ledgerhq/coin-tron/signer";
import type { TronSigner } from "@ledgerhq/coin-tron/types/index";
import Trx from "@ledgerhq/hw-app-trx";
import Transport from "@ledgerhq/hw-transport";
import { CreateSigner, createResolver } from "../../bridge/setup";
import { Resolver } from "../../hw/getAddress/types";

const createSigner: CreateSigner<TronSigner> = (transport: Transport) => {
  const trx = new Trx(transport);

  return {
    getAddress: (path: string, boolDisplay?: boolean) => trx.getAddress(path, boolDisplay),
    sign: (path: string, rawTxHex: string, tokenSignatures: string[]) =>
      trx.signTransaction(path, rawTxHex, tokenSignatures),
  };
};

const resolver: Resolver = createResolver(createSigner, tronResolver);

export { resolver };
