// Goal of this file is to inject all necessary device/signer dependency to coin-modules

import { createBridges, type CeloBridge } from "@ledgerhq/coin-celo/bridge";
import makeCliTools from "@ledgerhq/coin-celo/cli-transaction";
import CeloResolver from "@ledgerhq/coin-celo/hw-getAddress";
import { CeloSigner } from "@ledgerhq/coin-celo/signer";
import Celo from "@ledgerhq/hw-app-celo";
import Transport from "@ledgerhq/hw-transport";
import { CreateSigner, createResolver, executeWithSigner } from "../../bridge/setup";
import type { Resolver } from "../../hw/getAddress/types";

const createSigner: CreateSigner<CeloSigner> = (transport: Transport) => new Celo(transport);

const bridge: CeloBridge = createBridges(executeWithSigner(createSigner));

const resolver: Resolver = createResolver(createSigner, CeloResolver);

const cliTools = makeCliTools();

export { bridge, cliTools, resolver };
