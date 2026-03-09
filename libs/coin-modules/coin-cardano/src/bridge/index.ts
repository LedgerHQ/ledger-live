import getAddressWrapper from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import {
  getSerializedAddressParameters,
  updateTransaction,
  makeAccountBridgeReceive,
  makeScanAccounts,
  makeSync,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { CoinConfig } from "@ledgerhq/coin-framework/lib/config";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import type { AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import { broadcast } from "../broadcast";
import cardanoCoinConfig, { CardanoCoinConfig } from "../config";
import { createTransaction } from "../createTransaction";
import { estimateMaxSpendable } from "../estimateMaxSpendable";
import { getTransactionStatus } from "../getTransactionStatus/getTransactionStatus";
import resolver from "../hw-getAddress";
import { postSyncPatch } from "../postSyncPatch";
import { prepareTransaction } from "../prepareTransaction";
import { assignToAccountRaw, assignFromAccountRaw } from "../serialization";
import { buildSignOperation } from "../signOperation";
import { CardanoSigner } from "../signer";
import { makeGetAccountShape } from "../synchronisation";
import type { CardanoAccount, Transaction, TransactionStatus } from "../types";
import { validateAddress } from "../validateAddress";

export function buildCurrencyBridge(signerContext: SignerContext<CardanoSigner>): CurrencyBridge {
  const getAddress = resolver(signerContext);
  const scanAccounts = makeScanAccounts({
    getAccountShape: makeGetAccountShape(signerContext),
    getAddressFn: getAddressWrapper(getAddress),
    postSync: postSyncPatch,
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
    signRawOperation: () => {
      throw new Error("signRawOperation is not supported");
    },
    broadcast,
    assignToAccountRaw,
    assignFromAccountRaw,
    getSerializedAddressParameters,
    validateAddress,
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
