import getAddressWrapper from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import {
  defaultUpdateTransaction,
  makeAccountBridgeReceive,
  makeScanAccounts,
  makeSync,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { SignerContext } from "@ledgerhq/coin-framework/signer";

import type { AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import resolver from "../hw-getAddress";
import { initAccount } from "../initAccount";
import { broadcast } from "../js-broadcast";
import createTransaction from "../js-createTransaction";
import { estimateMaxSpendable } from "../js-estimateMaxSpendable";
import { getTransactionStatus } from "../js-getTransactionStatus";
import prepareTransaction from "../js-prepareTransaction";
import { buildSignOperation } from "../js-signOperation";
import { getAccountShape } from "../js-synchronization";
import {
  assignFromAccountRaw,
  assignToAccountRaw,
  fromOperationExtraRaw,
  toOperationExtraRaw,
} from "../serialization";
import type { Transaction } from "../types";
import { AlgorandAddress, AlgorandSignature, AlgorandSigner } from "../signer";

export function buildCurrencyBridge(
  signerContext: SignerContext<AlgorandSigner, AlgorandAddress | AlgorandSignature>,
): CurrencyBridge {
  const getAddress = resolver(signerContext);

  const scanAccounts = makeScanAccounts({
    getAccountShape,
    getAddressFn: getAddress,
  });

  return {
    preload: async () => Promise.resolve({}),
    hydrate: () => {},
    scanAccounts,
  };
}

export function buildAccountBridge(
  signerContext: SignerContext<AlgorandSigner, AlgorandAddress | AlgorandSignature>,
): AccountBridge<Transaction> {
  const getAddress = resolver(signerContext);

  const receive = makeAccountBridgeReceive(getAddressWrapper(getAddress));
  const signOperation = buildSignOperation(signerContext);
  const sync = makeSync({ getAccountShape });

  return {
    createTransaction,
    updateTransaction: defaultUpdateTransaction,
    prepareTransaction,
    getTransactionStatus,
    sync,
    receive,
    assignToAccountRaw,
    assignFromAccountRaw,
    initAccount,
    signOperation,
    broadcast,
    estimateMaxSpendable,
    fromOperationExtraRaw,
    toOperationExtraRaw,
  };
}

export function createBridges(
  signerContext: SignerContext<AlgorandSigner, AlgorandAddress | AlgorandSignature>,
) {
  return {
    currencyBridge: buildCurrencyBridge(signerContext),
    accountBridge: buildAccountBridge(signerContext),
  };
}
