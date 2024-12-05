// Goal of this file is to inject all necessary device/signer dependency to coin-modules

import { createBridges } from "@ledgerhq/coin-vechain/index";
import makeCliTools from "@ledgerhq/coin-vechain/test/cli";
import vechainResolver, { signMessage } from "@ledgerhq/coin-vechain/signer/index";
import { Transaction, VechainSigner } from "./types";
import Transport from "@ledgerhq/hw-transport";
import type { Bridge } from "@ledgerhq/types-live";
import Vet from "@ledgerhq/hw-app-vet";
import { CreateSigner, createResolver, executeWithSigner } from "../../bridge/setup";
import type { Resolver } from "../../hw/getAddress/types";

const createSigner: CreateSigner<VechainSigner> = (transport: Transport) => new Vet(transport);

const bridge: Bridge<Transaction> = createBridges(executeWithSigner(createSigner));

const messageSigner = {
  signMessage,
};

const resolver: Resolver = createResolver(createSigner, vechainResolver);

const cliTools = makeCliTools();

export { bridge, cliTools, messageSigner, resolver };
