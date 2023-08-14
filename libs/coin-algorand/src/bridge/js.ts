import getAddressWrapper from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import {
  defaultUpdateTransaction,
  makeAccountBridgeReceive,
  makeScanAccounts,
  makeSync,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import type { NetworkRequestCall } from "@ledgerhq/coin-framework/network";

import type { AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import { AlgorandAPI } from "../api";
import resolver from "../hw-getAddress";
import { initAccount } from "../initAccount";
import { broadcast } from "../js-broadcast";
import createTransaction from "../js-createTransaction";
import { estimateMaxSpendable } from "../js-estimateMaxSpendable";
import { getTransactionStatus } from "../js-getTransactionStatus";
import prepareTransaction from "../js-prepareTransaction";
import { buildSignOperation } from "../js-signOperation";
import { makeGetAccountShape } from "../js-synchronization";
import { assignFromAccountRaw, assignToAccountRaw } from "../serialization";
import type { Transaction } from "../types";
import { AlgorandAddress, AlgorandSignature, AlgorandSigner } from "../signer";

export function buildCurrencyBridge(
  signerContext: SignerContext<AlgorandSigner, AlgorandAddress | AlgorandSignature>,
  network: NetworkRequestCall,
): CurrencyBridge {
  const algorandAPI = new AlgorandAPI(network);
  const getAddress = resolver(signerContext);

  const getAccountShape = makeGetAccountShape(algorandAPI);
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
  network: NetworkRequestCall,
): AccountBridge<Transaction> {
  const algorandAPI = new AlgorandAPI(network);
  const getAddress = resolver(signerContext);

  const receive = makeAccountBridgeReceive(getAddressWrapper(getAddress));
  const signOperation = buildSignOperation(signerContext, algorandAPI);
  const getAccountShape = makeGetAccountShape(algorandAPI);
  const sync = makeSync({ getAccountShape });

  return {
    createTransaction,
    updateTransaction: defaultUpdateTransaction,
    prepareTransaction: prepareTransaction(algorandAPI),
    getTransactionStatus: getTransactionStatus(algorandAPI),
    sync,
    receive,
    assignToAccountRaw,
    assignFromAccountRaw,
    initAccount,
    signOperation,
    broadcast: broadcast(algorandAPI),
    estimateMaxSpendable: estimateMaxSpendable(algorandAPI),
  };
}

export function createBridges(
  signerContext: SignerContext<AlgorandSigner, AlgorandAddress | AlgorandSignature>,
  network: NetworkRequestCall,
) {
  return {
    currencyBridge: buildCurrencyBridge(signerContext, network),
    accountBridge: buildAccountBridge(signerContext, network),
  };
}
