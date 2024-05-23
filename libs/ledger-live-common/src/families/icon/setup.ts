// Goal of this file is to inject all necessary device/signer dependency to coin-modules

import { createBridges } from "@ledgerhq/coin-icon/bridge/index";
import makeCliTools from "@ledgerhq/coin-icon/cli-transaction";
import iconResolver from "@ledgerhq/coin-icon/hw-getAddress";
import { Transaction } from "@ledgerhq/coin-icon/types";
import Icon from "@ledgerhq/hw-app-icon";
import Transport from "@ledgerhq/hw-transport";
import type { Bridge } from "@ledgerhq/types-live";
import { CreateSigner, createResolver, executeWithSigner } from "../../bridge/setup";
import type { Resolver } from "../../hw/getAddress/types";

const createSigner: CreateSigner<Icon> = (transport: Transport) => {
  return new Icon(transport);
};

const bridge: Bridge<Transaction> = createBridges(executeWithSigner(createSigner));

const resolver: Resolver = createResolver(createSigner, iconResolver);

const cliTools = makeCliTools();

export { bridge, cliTools, resolver };
