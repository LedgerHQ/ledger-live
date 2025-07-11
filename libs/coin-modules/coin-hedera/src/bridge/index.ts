import {
  getSerializedAddressParameters,
  makeScanAccounts,
  makeSync,
  updateTransaction,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";
import resolver from "../signer/index";
import getAddressWrapper from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import type { AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import type { HederaAccount, Transaction, TransactionStatus, HederaSigner } from "../types";
import { getTransactionStatus } from "./getTransactionStatus";
import { estimateMaxSpendable } from "./estimateMaxSpendable";
import { prepareTransaction } from "./prepareTransaction";
import { createTransaction } from "./createTransaction";
import { getAccountShape, buildIterateResult } from "./synchronisation";
import { buildSignOperation } from "./signOperation";
import { broadcast } from "./broadcast";
import { receive } from "./receive";
import { getPreloadStrategy, hydrate, preload } from "../preload";

function buildCurrencyBridge(signerContext: SignerContext<HederaSigner>): CurrencyBridge {
  const getAddress = resolver(signerContext);

  const scanAccounts = makeScanAccounts({
    getAccountShape,
    buildIterateResult,
    getAddressFn: getAddressWrapper(getAddress),
  });

  return {
    preload,
    hydrate,
    getPreloadStrategy,
    scanAccounts,
  };
}

const sync = makeSync({ getAccountShape });

function buildAccountBridge(
  signerContext: SignerContext<HederaSigner>,
): AccountBridge<Transaction, HederaAccount, TransactionStatus> {
  const getAddress = resolver(signerContext);

  const signOperation = buildSignOperation(signerContext);

  return {
    estimateMaxSpendable,
    createTransaction,
    updateTransaction,
    getTransactionStatus,
    prepareTransaction,
    sync,
    receive: receive(getAddressWrapper(getAddress)),
    signOperation,
    broadcast,
    getSerializedAddressParameters,
  };
}

export function createBridges(signerContext: SignerContext<HederaSigner>) {
  return {
    currencyBridge: buildCurrencyBridge(signerContext),
    accountBridge: buildAccountBridge(signerContext),
  };
}
