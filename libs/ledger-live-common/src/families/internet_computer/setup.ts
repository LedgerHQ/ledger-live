// Goal of this file is to inject all necessary device/signer dependency to coin-modules

import { createBridges } from "@ledgerhq/coin-internet_computer/bridge/index";
import Transport from "@ledgerhq/hw-transport";
import ICP from "@zondax/ledger-icp";
import icpResolver from "@ledgerhq/coin-internet_computer/signer/index";
import { signMessage } from "@ledgerhq/coin-internet_computer/hw-signMessage";
import type { Account, Bridge } from "@ledgerhq/types-live";
import makeCliTools from "@ledgerhq/coin-internet_computer/test/cli";
import { CreateSigner, createResolver, executeWithSigner } from "../../bridge/setup";
import { Resolver } from "../../hw/getAddress/types";
import { TransactionStatus, Transaction } from "@ledgerhq/coin-internet_computer/types/index";
import { ICPGetAddrResponse, ICPSignature, ICPSigner } from "./types";
import { getPath, isError } from "./common";

const createSigner: CreateSigner<ICPSigner> = (transport: Transport) => {
  const icp = new ICP(transport);
  return {
    showAddressAndPubKey: async (path: string): Promise<ICPGetAddrResponse> => {
      const r = await icp.showAddressAndPubKey(getPath(path));
      isError(r);

      return r;
    },
    getAddressAndPubKey: async (path: string): Promise<ICPGetAddrResponse> => {
      const r = await icp.getAddressAndPubKey(getPath(path));
      isError(r);

      return r;
    },
    sign: async (path: string, message: Buffer): Promise<ICPSignature> => {
      const r = await icp.sign(getPath(path), message, 0);
      isError(r);

      return r;
    },
  };
};

const bridge: Bridge<Transaction, Account, TransactionStatus> = createBridges(
  executeWithSigner(createSigner),
);

const messageSigner = {
  signMessage,
};

const resolver: Resolver = createResolver(createSigner, icpResolver);

const cliTools = makeCliTools();

export { bridge, cliTools, messageSigner, resolver };
