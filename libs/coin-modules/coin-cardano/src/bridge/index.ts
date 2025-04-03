import getAddressWrapper from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import {
  getSerializedAddressParameters,
  makeAccountBridgeReceive,
  makeScanAccounts,
  makeSync,
  updateTransaction,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { CoinConfig } from "@ledgerhq/coin-framework/lib/config";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import type { CurrencyBridge } from "@ledgerhq/types-live";
import { broadcast } from "../broadcast";
import cardanoCoinConfig, { CardanoCoinConfig } from "../config";
import { createTransaction } from "../createTransaction";
import { estimateMaxSpendable } from "../estimateMaxSpendable";
import { getTransactionStatus } from "../getTransactionStatus";
import resolver from "../hw-getAddress";
import { postSyncPatch } from "../postSyncPatch";
import { prepareTransaction } from "../prepareTransaction";
import { assignFromAccountRaw, assignToAccountRaw } from "../serialization";
import { CardanoSigner } from "../signer";
import { buildSignOperation } from "../signOperation";
import { makeGetAccountShape } from "../synchronisation";
import { serialization } from "../transaction";
import type { CardanoAccountBridge, CardanoBridge } from "../types";

function buildCurrencyBridge(signerContext: SignerContext<CardanoSigner>): CurrencyBridge {
  const getAddress = resolver(signerContext);
  const scanAccounts = makeScanAccounts({
    getAccountShape: makeGetAccountShape(signerContext),
    getAddressFn: getAddressWrapper(getAddress),
  });

  return {
    scanAccounts,
    preload: async () => ({}),
    hydrate: () => {},
  };
}

function buildAccountBridge(signerContext: SignerContext<CardanoSigner>): CardanoAccountBridge {
  const sync = makeSync({
    getAccountShape: makeGetAccountShape(signerContext),
    postSync: postSyncPatch,
  });

  const getAddress = resolver(signerContext);

  const receive = makeAccountBridgeReceive(getAddressWrapper(getAddress));

  return {
    estimateMaxSpendable,
    createTransaction,
    updateTransaction,
    getTransactionStatus,
    prepareTransaction,
    sync,
    receive,
    signOperation: buildSignOperation(signerContext),
    broadcast,
    assignToAccountRaw,
    assignFromAccountRaw,
    getSerializedAddressParameters,
  };
}

export function createBridges(
  signerContext: SignerContext<CardanoSigner>,
  coinConfig: CoinConfig<CardanoCoinConfig>,
): CardanoBridge {
  cardanoCoinConfig.setCoinConfig(coinConfig);
  return {
    currencyBridge: buildCurrencyBridge(signerContext),
    accountBridge: buildAccountBridge(signerContext),
    ...serialization,
  };
}
