import {
  getSerializedAddressParameters,
  updateTransaction,
  makeAccountBridgeReceive,
  makeScanAccounts,
  makeSync,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import type { AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import getAddressWrapper from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import type { CardanoAccount, Transaction, TransactionStatus } from "../types";
import { assignToAccountRaw, assignFromAccountRaw } from "../serialization";
import { estimateMaxSpendable } from "../estimateMaxSpendable";
import { getTransactionStatus } from "../getTransactionStatus";
import { prepareTransaction } from "../prepareTransaction";
import { createTransaction } from "../createTransaction";
import { makeGetAccountShape } from "../synchronisation";
import { buildSignOperation } from "../signOperation";
import { postSyncPatch } from "../postSyncPatch";
import { CardanoSigner } from "../signer";
import { broadcast } from "../broadcast";
import resolver from "../hw-getAddress";
import { CoinConfig } from "@ledgerhq/coin-framework/lib/config";
import cardanoCoinConfig, { CardanoCoinConfig } from "../config";

export function buildCurrencyBridge(signerContext: SignerContext<CardanoSigner>): CurrencyBridge {
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

export function buildAccountBridge(
  signerContext: SignerContext<CardanoSigner>,
): AccountBridge<Transaction, CardanoAccount, TransactionStatus> {
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
) {
  cardanoCoinConfig.setCoinConfig(coinConfig);
  return {
    currencyBridge: buildCurrencyBridge(signerContext),
    accountBridge: buildAccountBridge(signerContext),
  };
}
