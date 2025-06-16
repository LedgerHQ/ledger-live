// Goal of this file is to inject all necessary device/signer dependency to coin-modules

import { createBridges } from "@ledgerhq/coin-stacks";
import stacksResolver, { signMessage } from "@ledgerhq/coin-stacks/signer/index";
import makeCliTools from "@ledgerhq/coin-stacks/test/cli";
import Transport from "@ledgerhq/hw-transport";
import { Bridge } from "@ledgerhq/types-live";
import BlockstackApp from "@zondax/ledger-stacks";
import { CreateSigner, createResolver, executeWithSigner } from "../../bridge/setup";
import { Resolver } from "../../hw/getAddress/types";
import { StacksSigner, Transaction } from "./types";

const createSigner: CreateSigner<StacksSigner> = (transport: Transport) => {
  return new BlockstackApp(transport);
};

const bridge: Bridge<Transaction> = createBridges(executeWithSigner(createSigner));

const messageSigner = {
  signMessage,
};

const resolver: Resolver = createResolver(createSigner, stacksResolver);

const cliTools = makeCliTools();

export { bridge, cliTools, messageSigner, resolver };
