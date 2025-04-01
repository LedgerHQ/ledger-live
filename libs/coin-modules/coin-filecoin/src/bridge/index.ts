import getAddressWrapper from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import {
  getSerializedAddressParameters,
  makeAccountBridgeReceive,
  makeScanAccounts,
  makeSync,
  updateTransaction,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import type { Account, AccountBridge, Bridge, CurrencyBridge } from "@ledgerhq/types-live";
import { getAccountShape } from "../common-logic/utils";
import resolver from "../signer";
import type { FilecoinSigner, Transaction, TransactionRaw, TransactionStatus } from "../types";
import { broadcast } from "./broadcast";
import { createTransaction } from "./createTransaction";
import { estimateMaxSpendable } from "./estimateMaxSpendable";
import { getTransactionStatus } from "./getTransactionStatus";
import { prepareTransaction } from "./prepareTransaction";
import { buildSignOperation } from "./signOperation";
import { serialization } from "./transaction";

function buildCurrencyBridge(signerContext: SignerContext<FilecoinSigner>): CurrencyBridge {
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
  signerContext: SignerContext<FilecoinSigner>,
): AccountBridge<Transaction, Account, TransactionStatus, TransactionRaw> {
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
    ...serialization,
  };
}

export type FilecoinBridge = Bridge<Transaction, Account, TransactionStatus, TransactionRaw>;
export function createBridges(signerContext: SignerContext<FilecoinSigner>): FilecoinBridge {
  return {
    currencyBridge: buildCurrencyBridge(signerContext),
    accountBridge: buildAccountBridge(signerContext),
  };
}
