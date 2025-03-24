// Goal of this file is to inject all necessary device/signer dependency to coin-modules

import { createBridges } from "@ledgerhq/coin-celo/bridge";
import makeCliTools from "@ledgerhq/coin-celo/cli-transaction";
import CeloResolver from "@ledgerhq/coin-celo/hw-getAddress";
import Transport from "@ledgerhq/hw-transport";
import type { Bridge } from "@ledgerhq/types-live";
import Celo from "@ledgerhq/hw-app-celo";
import { CreateSigner, createResolver, executeWithSigner } from "../../bridge/setup";
import type { Resolver } from "../../hw/getAddress/types";
import { Transaction, CeloAccount } from "./types";
import { CeloSigner } from "@ledgerhq/coin-celo/signer";

const createSigner: CreateSigner<CeloSigner> = (transport: Transport) => new Celo(transport);

const bridge: Bridge<Transaction, CeloAccount> = createBridges(executeWithSigner(createSigner));

const resolver: Resolver = createResolver(createSigner, CeloResolver);

const cliTools = makeCliTools();

export { bridge, cliTools, resolver };
