import getAddressWrapper from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import {
  defaultUpdateTransaction,
  makeAccountBridgeReceive,
  makeScanAccounts,
  makeSync,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import type { AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import resolver from "../hw-getAddress";
import broadcast from "../js-broadcast";
import estimateMaxSpendable from "../js-estimateMaxSpendable";
import getTransactionStatus from "../js-getTransactionStatus";
import { buildSignOperation } from "../js-signOperation";
import { getAccountShape } from "../js-synchronisation";
import { createTransaction, prepareTransaction } from "../js-transaction";
import type { Transaction } from "../types";

import { KadenaCoinConfig, setCoinConfig } from "../config";
import { KadenaSigner } from "../signer";

export function buildCurrencyBridge(signerContext: SignerContext<KadenaSigner>): CurrencyBridge {
  const getAddress = resolver(signerContext);

  const scanAccounts = makeScanAccounts({
    getAccountShape,
    getAddressFn: getAddress,
  });

  return {
    preload: () => Promise.resolve({}),
    hydrate: () => Promise.resolve({}),
    scanAccounts,
  };
}

export function buildAccountBridge(
  signerContext: SignerContext<KadenaSigner>,
): AccountBridge<Transaction> {
  const getAddress = resolver(signerContext);
  const sync = makeSync({ getAccountShape });

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

export function createBridges(
  signerContext: SignerContext<KadenaSigner>,
  coinConfig: KadenaCoinConfig,
) {
  setCoinConfig(coinConfig);

  return {
    currencyBridge: buildCurrencyBridge(signerContext),
    accountBridge: buildAccountBridge(signerContext),
  };
}
