import getAddressWrapper from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import {
  getSerializedAddressParameters,
  makeAccountBridgeReceive,
  makeScanAccounts,
  makeSync,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import type { CurrencyBridge } from "@ledgerhq/types-live";

import { CoinConfig } from "@ledgerhq/coin-framework/lib/config";
import cosmosCoinConfig, { CosmosCoinConfig } from "../config";
import { createTransaction } from "../createTransaction";
import { estimateMaxSpendable } from "../estimateMaxSpendable";
import formatters from "../formatters";
import getTransactionStatus from "../getTransactionStatus";
import resolver from "../hw-getAddress";
import { CosmosAPI } from "../network/Cosmos";
import { prepareTransaction } from "../prepareTransaction";
import {
  assignFromAccountRaw,
  assignToAccountRaw,
  fromOperationExtraRaw,
  toOperationExtraRaw,
} from "../serialization";
import { buildSignOperation } from "../signOperation";
import { getAccountShape } from "../synchronisation";
import { serialization } from "../transaction";
import type {
  CosmosAccountBridge,
  CosmosBridge
} from "../types";
import { CosmosSigner } from "../types/signer";
import { updateTransaction } from "../updateTransaction";
import { getPreloadStrategy, hydrate, preload } from "./preload";

const sync = makeSync({ getAccountShape });

function buildCurrencyBridge(signerContext: SignerContext<CosmosSigner>): CurrencyBridge {
  const getAddress = resolver(signerContext);

  const scanAccounts = makeScanAccounts({
    getAccountShape,
    getAddressFn: getAddressWrapper(getAddress),
  });

  return {
    getPreloadStrategy,
    preload,
    hydrate,
    scanAccounts,
  };
}

function buildAccountBridge(signerContext: SignerContext<CosmosSigner>): CosmosAccountBridge {
  const getAddress = resolver(signerContext);

  const receive = makeAccountBridgeReceive(getAddressWrapper(getAddress));
  const signOperation = buildSignOperation(signerContext);

  return {
    createTransaction,
    updateTransaction,
    prepareTransaction,
    estimateMaxSpendable,
    getTransactionStatus,
    sync,
    receive,
    signOperation,
    assignFromAccountRaw,
    assignToAccountRaw,
    broadcast: async ({ account, signedOperation }) => {
      return new CosmosAPI(account.currency.id).broadcast({
        signedOperation,
      });
    },
    fromOperationExtraRaw,
    toOperationExtraRaw,
    getSerializedAddressParameters,
    ...formatters,
  };
}

export function createBridges(
  signerContext: SignerContext<CosmosSigner>,
  coinConfig: CoinConfig<CosmosCoinConfig>,
): CosmosBridge {
  cosmosCoinConfig.setCoinConfig(coinConfig);
  return {
    currencyBridge: buildCurrencyBridge(signerContext),
    accountBridge: buildAccountBridge(signerContext),
    ...serialization,
  };
}
