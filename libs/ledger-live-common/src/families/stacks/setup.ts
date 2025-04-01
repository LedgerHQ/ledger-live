// Goal of this file is to inject all necessary device/signer dependency to coin-modules

import { createBridges, type StacksBridge } from "@ledgerhq/coin-stacks";
import stacksResolver, { signMessage } from "@ledgerhq/coin-stacks/signer/index";
import { StacksSigner } from "@ledgerhq/coin-stacks/types/index";
import makeCliTools from "@ledgerhq/coin-stacks/test/cli";
import Transport from "@ledgerhq/hw-transport";
import BlockstackApp from "@zondax/ledger-stacks";
import { CreateSigner, createResolver, executeWithSigner } from "../../bridge/setup";
import { Resolver } from "../../hw/getAddress/types";

const createSigner: CreateSigner<StacksSigner> = (transport: Transport) => {
  return new BlockstackApp(transport);
};

const bridge: StacksBridge = createBridges(executeWithSigner(createSigner));

const messageSigner = {
  signMessage,
};

const resolver: Resolver = createResolver(createSigner, stacksResolver);

const cliTools = makeCliTools();

export { bridge, cliTools, messageSigner, resolver };
