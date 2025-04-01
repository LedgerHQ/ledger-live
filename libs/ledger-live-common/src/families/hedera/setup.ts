// Goal of this file is to inject all necessary device/signer dependency to coin-modules

import { createBridges, type HederaBridge } from "@ledgerhq/coin-hedera/bridge/index";
import Transport from "@ledgerhq/hw-transport";
import Hedera from "@ledgerhq/hw-app-hedera";
import hederaResolver from "@ledgerhq/coin-hedera/signer/index";
import makeCliTools from "@ledgerhq/coin-hedera/test/cli";
import { CreateSigner, createResolver, executeWithSigner } from "../../bridge/setup";
import { Resolver } from "../../hw/getAddress/types";

const createSigner: CreateSigner<Hedera> = (transport: Transport) => {
  return new Hedera(transport);
};

const bridge: HederaBridge = createBridges(executeWithSigner(createSigner));

const resolver: Resolver = createResolver(createSigner, hederaResolver);

const cliTools = makeCliTools();

export { bridge, cliTools, resolver };
