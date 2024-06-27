// Goal of this file is to inject all necessary device/signer dependency to coin-modules
import { createBridges } from "@ledgerhq/coin-tron/bridge";
import { TronCoinConfig } from "@ledgerhq/coin-tron/config";
import tronResolver from "@ledgerhq/coin-tron/signer";
import type { CliTools } from "@ledgerhq/coin-tron/test/cli";
import makeCliTools from "@ledgerhq/coin-tron/test/cli";
import type { Transaction, TronAccount, TronSigner } from "@ledgerhq/coin-tron/types";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import Trx from "@ledgerhq/hw-app-trx";
import Transport from "@ledgerhq/hw-transport";
import type { Bridge } from "@ledgerhq/types-live";
import { CreateSigner, createResolver, executeWithSigner } from "../../bridge/setup";
import { getCurrencyConfiguration } from "../../config";
import { Resolver } from "../../hw/getAddress/types";

const createSigner: CreateSigner<TronSigner> = (transport: Transport) => {
  const trx = new Trx(transport);

  return {
    getAddress: (path: string, boolDisplay?: boolean) => trx.getAddress(path, boolDisplay),
    sign: (path: string, rawTxHex: string, tokenSignatures: string[]) =>
      trx.signTransaction(path, rawTxHex, tokenSignatures),
  };
};

const getCurrencyConfig = (): TronCoinConfig => {
  return getCurrencyConfiguration(getCryptoCurrencyById("tron"));
};

const bridge: Bridge<Transaction, TronAccount> = createBridges(
  executeWithSigner(createSigner),
  getCurrencyConfig,
);

const resolver: Resolver = createResolver(createSigner, tronResolver);

const cliTools: CliTools = makeCliTools();

export { bridge, cliTools, resolver };
