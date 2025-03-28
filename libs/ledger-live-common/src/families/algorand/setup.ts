// Goal of this file is to inject all necessary device/signer dependency to coin-modules

import { createBridges } from "@ledgerhq/coin-algorand/bridge/js";
import makeCliTools from "@ledgerhq/coin-algorand/cli-transaction";
import algorandResolver from "@ledgerhq/coin-algorand/hw-getAddress";
import Algorand from "@ledgerhq/hw-app-algorand";
import Transport from "@ledgerhq/hw-transport";
import { CreateSigner, createResolver, executeWithSigner } from "../../bridge/setup";
import type { Resolver } from "../../hw/getAddress/types";

const createSigner: CreateSigner<Algorand> = (transport: Transport) => {
  return new Algorand(transport);
};

const bridge = createBridges(executeWithSigner(createSigner));

const resolver: Resolver = createResolver(createSigner, algorandResolver);

const cliTools = makeCliTools();

export { bridge, cliTools, resolver };
