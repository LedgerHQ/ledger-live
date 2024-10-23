// Goal of this file is to inject all necessary device/signer dependency to coin-modules

import BlockstackApp from "@zondax/ledger-stacks"
import { Bridge } from "@ledgerhq/types-live";
import Transport from "@ledgerhq/hw-transport";
import { createBridges } from "@ledgerhq/coin-stacks";
import stacksResolver from "@ledgerhq/coin-stacks/signer/index";
import makeCliTools from "@ledgerhq/coin-xrp/test/cli";
import { CreateSigner, createResolver, executeWithSigner } from "../../bridge/setup";
import { Resolver } from "../../hw/getAddress/types";
import { StacksSigner, Transaction, TransactionStatus } from "./types";

const createSigner: CreateSigner<StacksSigner> = (transport: Transport) => {
  return new BlockstackApp(transport);
};

// const getCoinConfig = () =>
//   getCurrencyConfiguration<XrpCoinConfig>(getCryptoCurrencyById("ripple"));

const bridge: Bridge<Transaction> = createBridges(
  executeWithSigner(createSigner),
);

const resolver: Resolver = createResolver(createSigner, stacksResolver);

const cliTools = makeCliTools();

export { bridge, cliTools, resolver };
