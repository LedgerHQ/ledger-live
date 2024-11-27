import {
  getSerializedAddressParameters,
  makeAccountBridgeReceive,
  makeScanAccounts,
  updateTransaction,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import type { AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import getAddressWrapper from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import type { AlgorandAccount, Transaction, TransactionStatus } from "../types";
import { estimateMaxSpendable } from "../estimateMaxSpendable";
import { getTransactionStatus } from "../getTransactionStatus";
import { getAccountShape, sync } from "../synchronization";
import { prepareTransaction } from "../prepareTransaction";
import { createTransaction } from "../createTransaction";
import { buildSignOperation } from "../signOperation";
import { initAccount } from "../initAccount";
import { AlgorandSigner } from "../signer";
import { broadcast } from "../broadcast";
import resolver from "../hw-getAddress";
import {
  assignFromAccountRaw,
  assignToAccountRaw,
  fromOperationExtraRaw,
  toOperationExtraRaw,
} from "../serialization";

export function buildCurrencyBridge(signerContext: SignerContext<AlgorandSigner>): CurrencyBridge {
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
  signerContext: SignerContext<AlgorandSigner>,
): AccountBridge<Transaction, AlgorandAccount, TransactionStatus> {
  const getAddress = resolver(signerContext);

  const receive = makeAccountBridgeReceive(getAddressWrapper(getAddress));
  const signOperation = buildSignOperation(signerContext);

  return {
    createTransaction,
    updateTransaction,
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
    getSerializedAddressParameters,
  };
}

export function createBridges(signerContext: SignerContext<AlgorandSigner>) {
  return {
    currencyBridge: buildCurrencyBridge(signerContext),
    accountBridge: buildAccountBridge(signerContext),
  };
}
