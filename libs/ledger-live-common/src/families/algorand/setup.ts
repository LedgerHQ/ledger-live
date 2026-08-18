// Goal of this file is to inject all necessary device/signer dependency to coin-modules

import { createBridges } from "@ledgerhq/coin-algorand/bridge/js";
import type { AlgorandCoinConfig } from "@ledgerhq/coin-algorand/config";
import type { CoinConfig } from "@ledgerhq/coin-module-framework/config";
import algorandResolver from "@ledgerhq/coin-algorand/hw-getAddress";
import type {
  AlgorandAccount,
  AlgorandOperation,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/coin-algorand/types";
import Algorand from "@ledgerhq/hw-app-algorand";
import Transport from "@ledgerhq/hw-transport";
import { Bridge } from "@ledgerhq/types-live";
import { getEnv } from "@shared/env";
import { CreateSigner, createResolver, executeWithSigner } from "../../bridge/setup";
import type { Resolver } from "../../hw/getAddress/types";

// Coin configuration, resolved from the environment and threaded into createBridges (which seeds
// the coin-algorand config singleton), mirroring the other coin families.
const getCoinConfig: CoinConfig<AlgorandCoinConfig> = () => {
  const baseUrl = getEnv("API_ALGORAND_BLOCKCHAIN_EXPLORER_API_ENDPOINT");
  return {
    status: { type: "active" },
    node: `${baseUrl}/ps2/v2`,
    indexer: `${baseUrl}/idx2/v2`,
  };
};

const createSigner: CreateSigner<Algorand> = (transport: Transport) => {
  return new Algorand(transport);
};

const bridge: Bridge<Transaction, AlgorandAccount, TransactionStatus, AlgorandOperation> =
  createBridges(executeWithSigner(createSigner), getCoinConfig);

const resolver: Resolver = createResolver(createSigner, algorandResolver);

export { bridge, resolver };
