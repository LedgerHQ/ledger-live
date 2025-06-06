// Goal of this file is to inject all necessary device/signer dependency to coin-modules

import { createBridges } from "@ledgerhq/coin-casper/bridge";
import Transport from "@ledgerhq/hw-transport";
import Casper from "@zondax/ledger-casper";
import casperResolver from "@ledgerhq/coin-casper/signer";
import { signMessage } from "@ledgerhq/coin-casper/hw-signMessage";
import type { Account, Bridge } from "@ledgerhq/types-live";
import makeCliTools from "@ledgerhq/coin-casper/test/cli";
import { CreateSigner, createResolver, executeWithSigner } from "../../bridge/setup";
import { Resolver } from "../../hw/getAddress/types";
import { TransactionStatus, Transaction } from "@ledgerhq/coin-casper/types";
import { CasperGetAddrResponse, CasperSignature, CasperSigner } from "./types";
import { getCurrencyConfiguration } from "../../config";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { getPath, isError } from "./common";
import { CasperCoinConfig } from "@ledgerhq/coin-casper/config";

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

const getCoinConfig: CasperCoinConfig = () =>
  getCurrencyConfiguration<ReturnType<CasperCoinConfig>>(getCryptoCurrencyById("casper"));

const bridge: Bridge<Transaction, Account, TransactionStatus> = createBridges(
  executeWithSigner(createSigner),
  getCoinConfig,
);

const messageSigner = {
  signMessage,
};

const resolver: Resolver = createResolver(createSigner, casperResolver);

const cliTools = makeCliTools();

export { bridge, cliTools, messageSigner, resolver };
