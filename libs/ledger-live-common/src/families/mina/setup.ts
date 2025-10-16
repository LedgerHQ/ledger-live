// Goal of this file is to inject all necessary device/signer dependency to coin-modules

import { createBridges, makeCliTools } from "@ledgerhq/coin-mina/bridge";
import minaResolver from "@ledgerhq/coin-mina/signer";
import {
  Transaction,
  TransactionStatus,
  MinaAccount,
  MinaAccountRaw,
  MinaOperation,
} from "@ledgerhq/coin-mina/types";
import { MinaApp } from "@zondax/ledger-mina-js";
import Transport from "@ledgerhq/hw-transport";
import type { Bridge } from "@ledgerhq/types-live";
import { MinaSigner } from "@ledgerhq/coin-mina/types";
import { MinaCoinConfig } from "@ledgerhq/coin-mina/lib/config";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { CreateSigner, createResolver, executeWithSigner } from "../../bridge/setup";
import type { Resolver } from "../../hw/getAddress/types";
import { getCurrencyConfiguration } from "../../config";

const createSigner: CreateSigner<MinaSigner> = (transport: Transport) => {
  return new MinaApp(transport);
};

const getCoinConfig: MinaCoinConfig = () =>
  getCurrencyConfiguration<ReturnType<MinaCoinConfig>>(getCryptoCurrencyById("mina"));

const bridge: Bridge<Transaction, MinaAccount, TransactionStatus, MinaOperation, MinaAccountRaw> =
  createBridges(executeWithSigner(createSigner), getCoinConfig);

const resolver: Resolver = createResolver(createSigner, minaResolver);

const cliTools = makeCliTools();

export { bridge, cliTools, resolver };
