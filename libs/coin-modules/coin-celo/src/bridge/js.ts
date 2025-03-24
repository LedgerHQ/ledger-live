import type { AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import {
  getSerializedAddressParameters,
  updateTransaction,
  makeAccountBridgeReceive,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { getPreloadStrategy, preload, hydrate } from "../preload";
import { getTransactionStatus } from "../getTransactionStatus";
import { estimateMaxSpendable } from "../estimateMaxSpendable";
import { prepareTransaction } from "../prepareTransaction";
import { createTransaction } from "../createTransaction";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import resolver from "../hw-getAddress";
import { sync, scanAccounts } from "../synchronisation";
import { signOperation } from "../signOperation";
import type { CeloAccount, Transaction, TransactionStatus } from "../types";
import { broadcast } from "../broadcast";
import {
  assignFromAccountRaw,
  assignToAccountRaw,
  fromOperationExtraRaw,
  toOperationExtraRaw,
} from "../serialization";

// Example

export function buildCurrencyBridge(
  signerContext: SignerContext<CeloSigner, CeloAddress | CeloSignature>,
): CurrencyBridge {
  const getAddress = resolver(signerContext);

  const scanAccounts = makeScanAccounts({
    getAccountShape,
    getAddressFn: getAddress,
  });

  return {
    getPreloadStrategy,
    preload,
    hydrate,
    scanAccounts,
  };
}

export function buildAccountBridge(
  signerContext: SignerContext<CeloSigner, CeloAddress | CeloSignature>,
): AccountBridge<Transaction> {
  const getAddress = resolver(signerContext);

  const receive = makeAccountBridgeReceive(getAddressWrapper(getAddress));
  const signOperation = buildSignOperation(signerContext);

  return {
    estimateMaxSpendable,
    createTransaction,
    updateTransaction,
    getTransactionStatus,
    prepareTransaction,
    sync,
    receive,
    signOperation,
    broadcast,
  };
}

export function createBridges(
  signerContext: SignerContext<CeloSigner, CeloAddress | CeloSignature>,
) {
  return {
    currencyBridge: buildCurrencyBridge(signerContext),
    accountBridge: buildAccountBridge(signerContext),
  };
}

const currencyBridge: CurrencyBridge = {
  getPreloadStrategy,
  preload,
  hydrate,
  scanAccounts,
};
const accountBridge: AccountBridge<Transaction, CeloAccount, TransactionStatus> = {
  estimateMaxSpendable,
  createTransaction,
  updateTransaction,
  getTransactionStatus,
  prepareTransaction,
  sync,
  receive,
  signOperation,
  broadcast,
  assignFromAccountRaw,
  assignToAccountRaw,
  fromOperationExtraRaw,
  toOperationExtraRaw,
  getSerializedAddressParameters,
};
export default {
  currencyBridge,
  accountBridge,
};
