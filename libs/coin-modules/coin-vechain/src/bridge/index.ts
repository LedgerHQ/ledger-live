import { AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import {
  getSerializedAddressParameters,
  updateTransaction,
  makeAccountBridgeReceive,
  makeScanAccounts,
  makeSync,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import getAddressWrapper from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import { getTransactionStatus } from "./getTransactionStatus";
import { estimateMaxSpendable } from "./estimateMaxSpendable";
import { prepareTransaction } from "./prepareTransaction";
import { createTransaction } from "./createTransaction";
import { getAccountShape } from "./synchronisation";
import { buildSignOperation } from "./signOperation";
import { broadcast } from "./broadcast";
import resolver from "../signer";
import type { Transaction, VechainSigner } from "../types";

export function buildCurrencyBridge(signerContext: SignerContext<VechainSigner>): CurrencyBridge {
  const getAddress = resolver(signerContext);

  const scanAccounts = makeScanAccounts({
    getAccountShape,
    getAddressFn: getAddressWrapper(getAddress),
  });

  return {
    preload: async () => Promise.resolve({}),
    hydrate: () => {},
    scanAccounts,
  };
}

const sync = makeSync({ getAccountShape });

export function buildAccountBridge(
  signerContext: SignerContext<VechainSigner>,
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
    getSerializedAddressParameters,
  };
}

export function createBridges(signerContext: SignerContext<VechainSigner>) {
  return {
    currencyBridge: buildCurrencyBridge(signerContext),
    accountBridge: buildAccountBridge(signerContext),
  };
}
