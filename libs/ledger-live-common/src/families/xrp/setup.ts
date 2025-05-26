// Goal of this file is to inject all necessary device/signer dependency to coin-modules

import Xrp from "@ledgerhq/hw-app-xrp";
import Transport from "@ledgerhq/hw-transport";
import xrpResolver from "@ledgerhq/coin-xrp/signer/index";
import makeCliTools from "@ledgerhq/coin-xrp/test/cli";
import { CreateSigner, createResolver } from "../../bridge/setup";
import { Resolver } from "../../hw/getAddress/types";

const createSigner: CreateSigner<Xrp> = (transport: Transport) => {
  return new Xrp(transport);
};

const resolver: Resolver = createResolver(createSigner, xrpResolver);

const cliTools = makeCliTools();

export { cliTools, resolver };
