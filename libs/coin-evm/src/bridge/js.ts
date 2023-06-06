import getAddressWrapper from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import {
  makeAccountBridgeReceive,
  makeScanAccounts,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { SignerFactory } from "@ledgerhq/coin-framework/signer";
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
import { EvmSigner } from "../signer";
import type { Transaction as EvmTransaction, Transaction } from "../types";

const updateTransaction: AccountBridge<EvmTransaction>["updateTransaction"] = (
  transaction,
  patch,
) => {
  return { ...transaction, ...patch } as EvmTransaction;
};

export function buildCurrencyBridge(signerFactory: SignerFactory<EvmSigner>): CurrencyBridge {
  const getAddress = resolver(signerFactory);

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
  signerFactory: SignerFactory<EvmSigner>,
): AccountBridge<Transaction> {
  const getAddress = resolver(signerFactory);

  const receive = makeAccountBridgeReceive(getAddressWrapper(getAddress));
  const signOperation = buildSignOperation(signerFactory);

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

/**
 * FIXME: unsued network and cacheFn are passed to createBridges because of how the
 * libs/ledger-live-common/scripts/sync-families-dispatch.mjs script works.
 */
export function createBridges(
  signerFactory: SignerFactory<EvmSigner>,
  _network: unknown,
  _cacheFn: unknown,
) {
  return {
    currencyBridge: buildCurrencyBridge(signerFactory),
    accountBridge: buildAccountBridge(signerFactory),
  };
}
