// Goal of this file is to inject all necessary device/signer dependency to coin-modules

import { createBridges, type Transaction } from "@ledgerhq/coin-concordium";
import Transport from "@ledgerhq/hw-transport";
import Concordium from "@ledgerhq/hw-app-concordium";
import type { Bridge } from "@ledgerhq/types-live";
import { ConcordiumCoinConfig } from "@ledgerhq/coin-concordium/config";
import { type ConcordiumSigner } from "@ledgerhq/coin-concordium/types";
import concordiumResolver from "@ledgerhq/coin-concordium/signer";
import makeCliTools from "@ledgerhq/coin-concordium/test/cli";
import { CreateSigner, createResolver, executeWithSigner } from "../../bridge/setup";
import { Resolver } from "../../hw/getAddress/types";
import { getCurrencyConfiguration } from "../../config";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";

const createSigner: CreateSigner<ConcordiumSigner> = (transport: Transport) => {
  return new Concordium(transport);
};

const getCoinConfig = (): ConcordiumCoinConfig => {
  return getCurrencyConfiguration(getCryptoCurrencyById("concordium"));
};

const bridge: Bridge<Transaction> = createBridges(executeWithSigner(createSigner), getCoinConfig);

const resolver: Resolver = createResolver(createSigner, concordiumResolver);

const cliTools = makeCliTools();

export { bridge, cliTools, resolver };
