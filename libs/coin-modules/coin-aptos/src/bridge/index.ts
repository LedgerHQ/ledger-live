import {
  makeAccountBridgeReceive,
  makeScanAccounts,
  makeSync,
  updateTransaction,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";
import getAddressWrapper from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import type { Account, AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import { getSerializedAddressParameters } from "../exchange";
import resolver from "../signer";
import type { Transaction, TransactionStatus, AptosSigner } from "../types";
import getTransactionStatus from "./getTransactionStatus";
import estimateMaxSpendable from "./estimateMaxSpendable";
import prepareTransaction from "./prepareTransaction";
import createTransaction from "./createTransaction";
import { getAccountShape } from "./synchronisation";
import buildSignOperation from "./signOperation";
import broadcast from "./broadcast";

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
): AccountBridge<Transaction, Account, TransactionStatus> {
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
  };
}

export function createBridges(signerContext: SignerContext<AptosSigner>) {
  return {
    currencyBridge: buildCurrencyBridge(signerContext),
    accountBridge: buildAccountBridge(signerContext),
  };
}
