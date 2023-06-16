import getAddressWrapper from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import {
  makeAccountBridgeReceive,
  makeScanAccounts,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import type { AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import { broadcast } from "../broadcast";
import { createTransaction } from "../createTransaction";
import { estimateMaxSpendable } from "../estimateMaxSpendable";
import { getTransactionStatus } from "../getTransactionStatus";
import resolver from "../hw-getAddress";
import { hydrate, preload } from "../preload";
import { prepareTransaction } from "../prepareTransaction";
import { buildSignOperation } from "../signOperation";
import { getAccountShape, sync } from "../synchronization";
import { EvmAddress, EvmSignature, EvmSigner } from "../signer";
import type { Transaction as EvmTransaction, Transaction } from "../types";

const updateTransaction: AccountBridge<EvmTransaction>["updateTransaction"] = (
  transaction,
  patch,
) => {
  return { ...transaction, ...patch } as EvmTransaction;
};

export function buildCurrencyBridge(
  signerContext: SignerContext<EvmSigner, EvmAddress | EvmSignature>,
): CurrencyBridge {
  const getAddress = resolver(signerContext);

  const scanAccounts = makeScanAccounts({
    getAccountShape,
    getAddressFn: getAddress,
  });

  return {
    preload,
    hydrate,
    scanAccounts,
  };
}

export function buildAccountBridge(
  signerContext: SignerContext<EvmSigner, EvmAddress | EvmSignature>,
): AccountBridge<Transaction> {
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
    signOperation,
    broadcast,
    estimateMaxSpendable,
  };
}

export function createBridges(signerContext: SignerContext<EvmSigner, EvmAddress | EvmSignature>) {
  return {
    currencyBridge: buildCurrencyBridge(signerContext),
    accountBridge: buildAccountBridge(signerContext),
  };
}
