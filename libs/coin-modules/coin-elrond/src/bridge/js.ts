import type { AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import {
  defaultUpdateTransaction,
  makeAccountBridgeReceive,
  makeScanAccounts,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";
import type { ElrondAccount, Transaction, TransactionStatus } from "../types";
import { getPreloadStrategy, preload, hydrate } from "../preload";
import { getTransactionStatus } from "../getTransactionStatus";
import { estimateMaxSpendable } from "../estimateMaxSpendable";
import { prepareTransaction } from "../prepareTransaction";
import { sync } from "../synchronisation";
import { createTransaction } from "../createTransaction";
import { buildSignOperation } from "../signOperation";
import { broadcast } from "../broadcast";
import { getAccountShape } from "../synchronisation";
import {
  assignFromAccountRaw,
  assignToAccountRaw,
  fromOperationExtraRaw,
  toOperationExtraRaw,
} from "../serialization";
import { ElrondSigner } from "../signer";
import { SignerContext } from "@ledgerhq/coin-framework/lib/signer";
import resolver from "../hw-getAddress";
import getAddressWrapper from "@ledgerhq/coin-framework/bridge/getAddressWrapper";

export function buildCurrencyBridge(signerContext: SignerContext<ElrondSigner>): CurrencyBridge {
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
  signerContext: SignerContext<ElrondSigner>,
): AccountBridge<Transaction, ElrondAccount, TransactionStatus> {
  const getAddress = resolver(signerContext);

  const receive = makeAccountBridgeReceive(getAddressWrapper(getAddress));
  const signOperation = buildSignOperation(signerContext);

  return {
    estimateMaxSpendable,
    createTransaction,
    updateTransaction: defaultUpdateTransaction,
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
  };
}

export function createBridges(signerContext: SignerContext<ElrondSigner>) {
  return {
    currencyBridge: buildCurrencyBridge(signerContext),
    accountBridge: buildAccountBridge(signerContext),
  };
}
