import getAddressWrapper from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import {
  getSerializedAddressParameters,
  makeAccountBridgeReceive,
  makeScanAccounts,
  updateTransaction,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import type { AccountBridge, Bridge, CurrencyBridge } from "@ledgerhq/types-live";
import broadcast from "../broadcast";
import { TonCoinConfig, setCoinConfig } from "../config";
import createTransaction from "../createTransaction";
import estimateMaxSpendable from "../estimateMaxSpendable";
import getTransactionStatus from "../getTransactionStatus";
import resolver from "../hw-getAddress";
import prepareTransaction from "../prepareTransaction";
import { buildSignOperation } from "../signOperation";
import { TonSigner } from "../signer";
import { getAccountShape, sync } from "../synchronisation";
import { serialization } from "../transaction";
import type { TonAccount, Transaction, TransactionRaw, TransactionStatus } from "../types";

function buildCurrencyBridge(signerContext: SignerContext<TonSigner>): CurrencyBridge {
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

function buildAccountBridge(
  signerContext: SignerContext<TonSigner>,
): AccountBridge<Transaction, TonAccount, TransactionStatus, TransactionRaw> {
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

export type TonBridge = Bridge<Transaction, TonAccount, TransactionStatus, TransactionRaw>;

export function createBridges(
  signerContext: SignerContext<TonSigner>,
  coinConfig: TonCoinConfig,
): TonBridge {
  setCoinConfig(coinConfig);

  return {
    currencyBridge: buildCurrencyBridge(signerContext),
    accountBridge: buildAccountBridge(signerContext),
  };
}
