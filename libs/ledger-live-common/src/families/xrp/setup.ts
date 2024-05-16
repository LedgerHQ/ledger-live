// Goal of this file is to inject all necessary device/signer dependency to coin-modules

import Xrp from "@ledgerhq/hw-app-xrp";
import { Bridge } from "@ledgerhq/types-live";
import Transport from "@ledgerhq/hw-transport";
import { XrpConfig } from "@ledgerhq/coin-xrp/lib/config";
import xrpResolver from "@ledgerhq/coin-xrp/hw-getAddress";
import { createBridges } from "@ledgerhq/coin-xrp/bridge/js";
import makeCliTools from "@ledgerhq/coin-xrp/cli-transaction";
import { Transaction as XrpTransaction } from "@ledgerhq/coin-xrp/types";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { CreateSigner, createResolver, executeWithSigner } from "../../bridge/setup";
import { getCurrencyConfiguration } from "../../config";
import { Resolver } from "../../hw/getAddress/types";

const createSigner: CreateSigner<Xrp> = (transport: Transport) => {
  return new Xrp(transport);
};

const getCoinConfig = () => getCurrencyConfiguration<XrpConfig>(getCryptoCurrencyById("ripple"));

const bridge: Bridge<XrpTransaction> = createBridges(
  executeWithSigner(createSigner),
  getCoinConfig,
);

const resolver: Resolver = createResolver(createSigner, xrpResolver);

const cliTools = makeCliTools();

export { bridge, cliTools, resolver };
