import getAddressWrapper from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import {
  getSerializedAddressParameters,
  updateTransaction,
  makeAccountBridgeReceive,
  makeScanAccounts,
  makeSync,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { CoinConfig } from "@ledgerhq/coin-framework/config";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import type { AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import xrpCoinConfig, { type XrpCoinConfig } from "../config";
import resolver from "../signer";
import { XrpSigner } from "../types";
import type { Transaction } from "../types";
import { broadcast } from "./broadcast";
import { createTransaction } from "./createTransaction";
import { estimateMaxSpendable } from "./estimateMaxSpendable";
import { getTransactionStatus } from "./getTransactionStatus";
import { prepareTransaction } from "./prepareTransaction";
import { buildSignOperation } from "./signOperation";
import { getAccountShape } from "./synchronization";

export function createBridges(
  signerContext: SignerContext<XrpSigner>,
  coinConfig: CoinConfig<XrpCoinConfig>,
) {
  xrpCoinConfig.setCoinConfig(coinConfig);

  const getAddress = resolver(signerContext);

  const scanAccounts = makeScanAccounts({ getAccountShape, getAddressFn: getAddress });
  const currencyBridge: CurrencyBridge = {
    preload: () => Promise.resolve({}),
    hydrate: () => {},
    scanAccounts,
  };

  const receive = makeAccountBridgeReceive(getAddressWrapper(getAddress));
  const signOperation = buildSignOperation(signerContext);
  const sync = makeSync({ getAccountShape });
  const accountBridge: AccountBridge<Transaction> = {
    createTransaction,
    updateTransaction: updateTransaction<Transaction>,
    prepareTransaction,
    getTransactionStatus,
    estimateMaxSpendable,
    sync,
    receive,
    signOperation,
    broadcast,
    getSerializedAddressParameters,
  };

  return {
    currencyBridge,
    accountBridge,
  };
}
