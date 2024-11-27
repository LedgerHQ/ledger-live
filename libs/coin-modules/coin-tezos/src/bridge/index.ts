import {
  getSerializedAddressParameters,
  updateTransaction,
  makeAccountBridgeReceive,
  makeScanAccounts,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { CoinConfig } from "@ledgerhq/coin-framework/config";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import type { CurrencyBridge, AccountBridge } from "@ledgerhq/types-live";
import getAddressWrapper from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import type { TezosAccount, TezosSigner, Transaction, TransactionStatus } from "../types";
import { assignFromAccountRaw, assignToAccountRaw } from "./serialization";
import { getPreloadStrategy, hydrate, preload } from "./preload";
import { estimateMaxSpendable } from "./estimateMaxSpendable";
import { getTransactionStatus } from "./getTransactionStatus";
import { prepareTransaction } from "./prepareTransaction";
import { getAccountShape, sync } from "./synchronization";
import { createTransaction } from "./createTransaction";
import { buildSignOperation } from "./signOperation";
import signerGetAddress from "../signer";
import { broadcast } from "./broadcast";
import tezosCoinConfig, { TezosCoinConfig } from "../config";

function buildCurrencyBridge(signerContext: SignerContext<TezosSigner>): CurrencyBridge {
  const getAddress = signerGetAddress(signerContext);

  const scanAccounts = makeScanAccounts({
    getAccountShape,
    getAddressFn: getAddressWrapper(getAddress),
  });

  return {
    getPreloadStrategy,
    preload,
    hydrate,
    scanAccounts,
  };
}

function buildAccountBridge(
  signerContext: SignerContext<TezosSigner>,
): AccountBridge<Transaction, TezosAccount, TransactionStatus> {
  const getAddress = signerGetAddress(signerContext);

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
    assignFromAccountRaw,
    assignToAccountRaw,
    getSerializedAddressParameters,
  };
}

export function createBridges(
  signerContext: SignerContext<TezosSigner>,
  coinConfig: CoinConfig<TezosCoinConfig>,
) {
  tezosCoinConfig.setCoinConfig(coinConfig);

  return {
    currencyBridge: buildCurrencyBridge(signerContext),
    accountBridge: buildAccountBridge(signerContext),
  };
}
