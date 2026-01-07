// Goal of this file is to inject all necessary device/signer dependency to coin-modules

import { createBridges } from "@ledgerhq/coin-celo/bridge";
import makeCliTools from "@ledgerhq/coin-celo/cli-transaction";
import CeloResolver from "@ledgerhq/coin-celo/hw-getAddress";
import Transport from "@ledgerhq/hw-transport";
import type { Bridge } from "@ledgerhq/types-live";
import Celo from "@ledgerhq/hw-app-celo";
import { CreateSigner, createResolver, executeWithSigner } from "../../bridge/setup";
import type { Resolver } from "../../hw/getAddress/types";
import { Transaction, CeloAccount } from "./types";
import { CeloSigner } from "@ledgerhq/coin-celo/signer";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { createApi as createEvmApi } from "@ledgerhq/coin-evm/api/index";
import { getCurrencyConfiguration } from "../../config";
import type { EvmConfigInfo } from "@ledgerhq/coin-evm/config";

const createSigner: CreateSigner<CeloSigner> = (transport: Transport) => new Celo(transport);

// NOTE Create an unused instance of EVM API with Celo configuration.
// It has the side effect of initializing the EVM coin config as well as injecting
// the input Celo config.
// TODO Remove this hack while deleting the Celo bridge
const getCurrencyConfig = () => {
  return { info: getCurrencyConfiguration<EvmConfigInfo>(getCryptoCurrencyById("celo")) };
};
createEvmApi(getCurrencyConfig, "celo");
const bridge: Bridge<Transaction, CeloAccount> = createBridges(executeWithSigner(createSigner));

const resolver: Resolver = createResolver(createSigner, CeloResolver);

const cliTools = makeCliTools();

export { bridge, cliTools, resolver };
