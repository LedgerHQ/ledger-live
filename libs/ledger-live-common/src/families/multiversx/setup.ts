// Goal of this file is to inject all necessary device/signer dependency to coin-modules

import { createBridges, type MultiversXBridge } from "@ledgerhq/coin-multiversx/bridge/js";
import makeCliTools from "@ledgerhq/coin-multiversx/cli-transaction";
import multiversxResolver from "@ledgerhq/coin-multiversx/hw-getAddress";
import MultiversX from "@ledgerhq/hw-app-multiversx";
import Transport from "@ledgerhq/hw-transport";
import { CreateSigner, createResolver, executeWithSigner } from "../../bridge/setup";
import type { Resolver } from "../../hw/getAddress/types";

const createSigner: CreateSigner<MultiversX> = (transport: Transport) => {
  return new MultiversX(transport);
};

const bridge: MultiversXBridge = createBridges(executeWithSigner(createSigner));

const resolver: Resolver = createResolver(createSigner, multiversxResolver);

const cliTools = makeCliTools();

export { bridge, cliTools, resolver };
