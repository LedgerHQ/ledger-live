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
import { CreateSigner, createResolver, executeWithSigner } from "../../bridge/setup";
import { getCurrencyConfiguration } from "../../config";
import type { Resolver } from "../../hw/getAddress/types";
import { withGenericTransactionSupport } from "./legacyBridgeAdapter";

const getCoinConfig: CoinConfig<AlgorandCoinConfig> = () =>
  getCurrencyConfiguration<AlgorandCoinConfig>("algorand");

const createSigner: CreateSigner<Algorand> = (transport: Transport) => {
  return new Algorand(transport);
};

const legacyBridge: Bridge<Transaction, AlgorandAccount, TransactionStatus, AlgorandOperation> =
  createBridges(executeWithSigner(createSigner), getCoinConfig);

const bridge: Bridge<Transaction, AlgorandAccount, TransactionStatus, AlgorandOperation> = {
  ...legacyBridge,
  accountBridge: withGenericTransactionSupport(legacyBridge.accountBridge),
};

const resolver: Resolver = createResolver(createSigner, algorandResolver);

export { bridge, resolver };
