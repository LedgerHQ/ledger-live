// Goal of this file is to inject all necessary device/signer dependency to coin-modules

import { createBridges } from "@ledgerhq/coin-aleo/bridge/index";
import makeCliTools from "@ledgerhq/coin-aleo/test/cli";
import aleoResolver from "@ledgerhq/coin-aleo/signer/index";
import type { AleoSigner, Transaction as AleoTransaction } from "@ledgerhq/coin-aleo/types/index";
import Transport from "@ledgerhq/hw-transport";
import type { Bridge } from "@ledgerhq/types-live";
import { CreateSigner, createResolver, executeWithSigner } from "../../bridge/setup";
import { Resolver } from "../../hw/getAddress/types";

const createSigner: CreateSigner<AleoSigner> = (_transport: Transport) => {
  throw new Error("Aleo signer is not yet implemented");
};

const bridge: Bridge<AleoTransaction> = createBridges(executeWithSigner(createSigner));

const resolver: Resolver = createResolver(createSigner, aleoResolver);

const cliTools = makeCliTools();

export { bridge, cliTools, resolver };
