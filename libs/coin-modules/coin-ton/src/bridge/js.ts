import getAddressWrapper from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import {
  defaultUpdateTransaction,
  makeAccountBridgeReceive,
  makeScanAccounts,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { SignerContext } from "@ledgerhq/coin-framework/signer";

import type { AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import resolver from "../hw-getAddress";
import broadcast from "../js-broadcast";
import createTransaction from "../js-createTransaction";
import estimateMaxSpendable from "../js-estimateMaxSpendable";
import getTransactionStatus from "../js-getTransactionStatus";
import prepareTransaction from "../js-prepareTransaction";
import { buildSignOperation } from "../js-signOperation";
import { getAccountShape, sync } from "../js-synchronisation";
import { TonAddress, TonSignature, TonSigner } from "../signer";
import type { Transaction } from "../types";

export function buildCurrencyBridge(
  signerContext: SignerContext<TonSigner, TonAddress | TonSignature>,
): CurrencyBridge {
  const getAddress = resolver(signerContext);

  const scanAccounts = makeScanAccounts({
    getAccountShape,
    getAddressFn: getAddress,
  });

  return {
    preload: async () => Promise.resolve({}),
    hydrate: () => {},
    scanAccounts,
  };
}

export function buildAccountBridge(
  signerContext: SignerContext<TonSigner, TonAddress | TonSignature>,
): AccountBridge<Transaction> {
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
  };
}

export function createBridges(signerContext: SignerContext<TonSigner, TonAddress | TonSignature>) {
  return {
    currencyBridge: buildCurrencyBridge(signerContext),
    accountBridge: buildAccountBridge(signerContext),
  };
}
