// Goal of this file is to inject all necessary device/signer dependency to coin-modules

import kaspaResolver from "@ledgerhq/coin-kaspa/hw-getAddress";
import Kaspa from "@ledgerhq/hw-app-kaspa";
import Transport from "@ledgerhq/hw-transport";
import { CreateSigner, createResolver, executeWithSigner } from "../../bridge/setup";
import type { Resolver } from "../../hw/getAddress/types";
import { KaspaSigner } from "@ledgerhq/coin-kaspa/lib/signer";

const createSigner: CreateSigner<KaspaSigner> = (transport: Transport) => {
  return new Kaspa(transport);
};

const resolver: Resolver = createResolver(createSigner, kaspaResolver);

const bridge = {};
const cliTools = {};

export { bridge, cliTools, resolver };
