import type { CurrencyBridge, AccountBridge } from "@ledgerhq/types-live";
import getAddressWrapper from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import {
  defaultUpdateTransaction,
  makeAccountBridgeReceive,
  makeScanAccounts,
  makeSync,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import type { TezosSigner, Transaction } from "../types";
import signerGetAddress from "../signer";
import { getAccountShape } from "./getAccountShape";
import buildSignOperation from "./signOperation";
import { assignFromAccountRaw, assignToAccountRaw } from "./serialization";
import { getPreloadStrategy, hydrate, preload } from "./preload";
import { getTransactionStatus } from "./transactionStatus";
import prepareTransaction from "./prepareTransaction";
import estimateMaxSpendable from "./estimateMaxSpendable";
import createTransaction from "./createTransaction";
import broadcast from "./broadcast";

function buildCurrencyBridge(signerContext: SignerContext<TezosSigner>): CurrencyBridge {
  const getAddress = signerGetAddress(signerContext);

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

function buildAccountBridge(signerContext: SignerContext<TezosSigner>): AccountBridge<Transaction> {
  const getAddress = signerGetAddress(signerContext);

  const receive = makeAccountBridgeReceive(getAddressWrapper(getAddress));
  const signOperation = buildSignOperation(signerContext);
  const sync = makeSync({ getAccountShape });

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
  };
}

export function createBridges(signerContext: SignerContext<TezosSigner>) {
  return {
    currencyBridge: buildCurrencyBridge(signerContext),
    accountBridge: buildAccountBridge(signerContext),
  };
}
