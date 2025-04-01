// Goal of this file is to inject all necessary device/signer dependency to coin-modules

import { createBridges, type PolkadotBridge } from "@ledgerhq/coin-polkadot";
import Transport from "@ledgerhq/hw-transport";
import Polkadot from "@ledgerhq/hw-app-polkadot";
import { PolkadotCoinConfig } from "@ledgerhq/coin-polkadot/config";
import polkadotResolver from "@ledgerhq/coin-polkadot/signer/index";
import makeCliTools, { type CliTools } from "@ledgerhq/coin-polkadot/test/cli";
import { CreateSigner, createResolver, executeWithSigner } from "../../bridge/setup";
import { Resolver } from "../../hw/getAddress/types";
import { getCurrencyConfiguration } from "../../config";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";

const createSigner: CreateSigner<Polkadot> = (transport: Transport) => {
  return new Polkadot(transport);
};

const polkadot = getCryptoCurrencyById("polkadot");
const getCurrencyConfig = (): PolkadotCoinConfig => {
  return getCurrencyConfiguration(polkadot);
};

const bridge: PolkadotBridge = createBridges(executeWithSigner(createSigner), getCurrencyConfig);

const resolver: Resolver = createResolver(createSigner, polkadotResolver);

const cliTools: CliTools = makeCliTools();

export { bridge, cliTools, resolver };
