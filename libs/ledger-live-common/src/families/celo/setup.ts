// Goal of this file is to inject all necessary device/signer dependency to coin-modules

import { createBridges } from "@ledgerhq/coin-celo/bridge/js";
import makeCliTools from "@ledgerhq/coin-celo/cli-transaction";
import CeloResolver from "@ledgerhq/coin-celo/hw-getAddress";
// import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import Transport from "@ledgerhq/hw-transport";
import type { Bridge } from "@ledgerhq/types-live";
import Celo from "@ledgerhq/hw-app-celo";
import { CreateSigner, createResolver, executeWithSigner } from "../../bridge/setup";
// import { getCurrencyConfiguration } from "../../config";
import type { Resolver } from "../../hw/getAddress/types";
import { Transaction, CeloAccount } from "@ledgerhq/coin-celo/lib/types";
import { CeloSigner } from "@ledgerhq/coin-celo/lib/signer";
// import { celoConfig } from "./config";

const createSigner: CreateSigner<CeloSigner> = (transport: Transport) => new Celo(transport);

// const getCoinConfig: celoConfig = () =>
// getCurrencyConfiguration<ReturnType<celoConfig>>(getCryptoCurrencyById("ton"));

// const bridge: Bridge<Transaction> = createBridges(executeWithSigner(createSigner), getCoinConfig);

const bridge: Bridge<Transaction, CeloAccount> = createBridges(executeWithSigner(createSigner));

const resolver: Resolver = createResolver(createSigner, CeloResolver);

const cliTools = makeCliTools();

export { bridge, cliTools, resolver };
