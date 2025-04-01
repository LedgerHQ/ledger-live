// Goal of this file is to inject all necessary device/signer dependency to coin-modules

import Xrp from "@ledgerhq/hw-app-xrp";
import Transport from "@ledgerhq/hw-transport";
import { createBridges, type XrpCoinConfig, type XrpBridge } from "@ledgerhq/coin-xrp";
import xrpResolver from "@ledgerhq/coin-xrp/signer/index";
import makeCliTools from "@ledgerhq/coin-xrp/test/cli";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { CreateSigner, createResolver, executeWithSigner } from "../../bridge/setup";
import { getCurrencyConfiguration } from "../../config";
import { Resolver } from "../../hw/getAddress/types";

const createSigner: CreateSigner<Xrp> = (transport: Transport) => {
  return new Xrp(transport);
};

const getCoinConfig = () =>
  getCurrencyConfiguration<XrpCoinConfig>(getCryptoCurrencyById("ripple"));

const bridge: XrpBridge = createBridges(executeWithSigner(createSigner), getCoinConfig);

const resolver: Resolver = createResolver(createSigner, xrpResolver);

const cliTools = makeCliTools();

export { bridge, cliTools, resolver };
