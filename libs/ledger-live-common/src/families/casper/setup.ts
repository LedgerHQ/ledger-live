// Goal of this file is to inject all necessary device/signer dependency to coin-modules

import { createBridges, type CasperBridge } from "@ledgerhq/coin-casper/bridge/index";
import Transport from "@ledgerhq/hw-transport";
import Casper from "@zondax/ledger-casper";
import casperResolver from "@ledgerhq/coin-casper/signer/index";
import { signMessage } from "@ledgerhq/coin-casper/hw-signMessage";
import makeCliTools from "@ledgerhq/coin-casper/test/cli";
import { CreateSigner, createResolver, executeWithSigner } from "../../bridge/setup";
import { Resolver } from "../../hw/getAddress/types";
import { CasperGetAddrResponse, CasperSignature, CasperSigner } from "./types";
import { getPath, isError } from "./common";

const createSigner: CreateSigner<CasperSigner> = (transport: Transport) => {
  const casper = new Casper(transport);
  return {
    showAddressAndPubKey: async (path: string): Promise<CasperGetAddrResponse> => {
      const r = await casper.showAddressAndPubKey(getPath(path));
      isError(r);

      return r;
    },
    getAddressAndPubKey: async (path: string): Promise<CasperGetAddrResponse> => {
      const r = await casper.getAddressAndPubKey(getPath(path));
      isError(r);

      return r;
    },
    sign: async (path: string, message: Buffer): Promise<CasperSignature> => {
      const r = await casper.sign(getPath(path), message);
      isError(r);

      return r;
    },
  };
};

const bridge: CasperBridge = createBridges(executeWithSigner(createSigner));

const messageSigner = {
  signMessage,
};

const resolver: Resolver = createResolver(createSigner, casperResolver);

const cliTools = makeCliTools();

export { bridge, cliTools, messageSigner, resolver };
