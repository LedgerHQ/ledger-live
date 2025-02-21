import {
  getSerializedAddressParameters,
  makeAccountBridgeReceive,
  makeScanAccounts,
  makeSync,
  updateTransaction,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";
import resolver from "../signer";
import getAddressWrapper from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import type { Account, AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus, CasperSigner } from "../types";
import { getTransactionStatus } from "./getTransactionStatus";
import { estimateMaxSpendable } from "./estimateMaxSpendable";
import { prepareTransaction } from "./prepareTransaction";
import { createTransaction } from "./createTransaction";
import { getAccountShape } from "./bridgeHelpers/accountShape";
import { buildSignOperation } from "./signOperation";
import { broadcast } from "./broadcast";

function buildCurrencyBridge(signerContext: SignerContext<CasperSigner>): CurrencyBridge {
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
  signerContext: SignerContext<CasperSigner>,
): AccountBridge<Transaction, Account, TransactionStatus> {
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
    getSerializedAddressParameters,
  };
}

export function createBridges(signerContext: SignerContext<CasperSigner>) {
  return {
    currencyBridge: buildCurrencyBridge(signerContext),
    accountBridge: buildAccountBridge(signerContext),
  };
}
