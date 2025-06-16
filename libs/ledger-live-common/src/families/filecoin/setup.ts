// Goal of this file is to inject all necessary device/signer dependency to coin-modules

import { createBridges } from "@ledgerhq/coin-filecoin/index";
import Transport from "@ledgerhq/hw-transport";
import FilecoinApp from "@zondax/ledger-filecoin";
import filecoinResolver from "@ledgerhq/coin-filecoin/signer/index";
import { signMessage } from "@ledgerhq/coin-filecoin/hw-signMessage";
import type { Account, Bridge } from "@ledgerhq/types-live";
import makeCliTools from "@ledgerhq/coin-filecoin/test/cli";
import { CreateSigner, createResolver, executeWithSigner } from "../../bridge/setup";
import { Resolver } from "../../hw/getAddress/types";
import {
  TransactionStatus,
  Transaction,
  FilecoinGetAddrResponse,
  FilecoinSignature,
  FilecoinSigner,
} from "./types";
import { getPath, isError } from "./common";

const createSigner: CreateSigner<FilecoinSigner> = (transport: Transport) => {
  const filecoin = new FilecoinApp(transport);
  return {
    showAddressAndPubKey: async (path: string): Promise<FilecoinGetAddrResponse> => {
      const r = await filecoin.showAddressAndPubKey(getPath(path));
      isError(r);

      return r;
    },
    getAddressAndPubKey: async (path: string): Promise<FilecoinGetAddrResponse> => {
      const r = await filecoin.getAddressAndPubKey(getPath(path));
      isError(r);

      return r;
    },
    sign: async (path: string, message: Uint8Array): Promise<FilecoinSignature> => {
      const r = await filecoin.sign(getPath(path), message);
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

const resolver: Resolver = createResolver(createSigner, filecoinResolver);

const cliTools = makeCliTools();

export { bridge, cliTools, messageSigner, resolver };
