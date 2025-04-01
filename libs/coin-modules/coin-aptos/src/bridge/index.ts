import getAddressWrapper from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import {
  getSerializedAddressParameters,
  makeAccountBridgeReceive,
  makeScanAccounts,
  makeSync,
  updateTransaction,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import type { Account, AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import resolver from "../signer";
import type { AptosSigner, Transaction, TransactionRaw, TransactionStatus } from "../types";
import broadcast from "./broadcast";
import createTransaction from "./createTransaction";
import estimateMaxSpendable from "./estimateMaxSpendable";
import getTransactionStatus from "./getTransactionStatus";
import prepareTransaction from "./prepareTransaction";
import buildSignOperation from "./signOperation";
import { getAccountShape } from "./synchronisation";
import serialization from "./transaction";

function buildCurrencyBridge(signerContext: SignerContext<AptosSigner>): CurrencyBridge {
  const getAddress = resolver(signerContext);

  const scanAccounts = makeScanAccounts({
    getAccountShape,
    getAddressFn: getAddressWrapper(getAddress),
  });

  return {
    preload: () => Promise.resolve({}),
    hydrate: () => {},
    scanAccounts,
  };
}

const sync = makeSync({ getAccountShape });

function buildAccountBridge(
  signerContext: SignerContext<AptosSigner>,
): AccountBridge<Transaction, Account, TransactionStatus, TransactionRaw> {
  const getAddress = resolver(signerContext);

  const receive = makeAccountBridgeReceive(getAddressWrapper(getAddress));
  const signOperation = buildSignOperation(signerContext);

  return {
    estimateMaxSpendable,
    createTransaction,
    updateTransaction,
    getTransactionStatus,
    getSerializedAddressParameters,
    prepareTransaction,
    sync,
    receive,
    signOperation,
    broadcast,
    ...serialization,
  };
}

export function createBridges(signerContext: SignerContext<AptosSigner>) {
  return {
    currencyBridge: buildCurrencyBridge(signerContext),
    accountBridge: buildAccountBridge(signerContext),
  };
}
