import getAddressWrapper from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import {
  makeAccountBridgeReceive,
  getSerializedAddressParameters,
  updateTransaction,
  makeScanAccounts,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import { MinaCoinConfig, setCoinConfig } from "../config";
import resolver from "../signer/getAddress";
import type {
  MinaAccount,
  MinaAccountRaw,
  MinaOperation,
  Transaction,
  TransactionStatus,
} from "../types/common";
import { MinaSigner } from "../types/signer";
import broadcast from "./broadcast";
import makeCliTools from "./cli-transaction";
import { createTransaction } from "./createTransaction";
import estimateMaxSpendable from "./estimateMaxSpendable";
import getTransactionStatus from "./getTransactionStatus";
import { prepareTransaction } from "./prepareTransaction";
import buildSignOperation from "./signOperation";
import { sync, getAccountShape, assignToAccountRaw, assignFromAccountRaw } from "./synchronisation";
import { validateAddress } from "./validateAddress";

export { makeCliTools };

export function buildCurrencyBridge(signerContext: SignerContext<MinaSigner>): CurrencyBridge {
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
  signerContext: SignerContext<MinaSigner>,
): AccountBridge<Transaction, MinaAccount, TransactionStatus, MinaOperation, MinaAccountRaw> {
  const getAddress = resolver(signerContext);

  const receive = makeAccountBridgeReceive(getAddressWrapper(getAddress));
  const signOperation = buildSignOperation(signerContext);

  return {
    estimateMaxSpendable,
    createTransaction,
    updateTransaction,
    assignToAccountRaw,
    assignFromAccountRaw,
    getTransactionStatus,
    prepareTransaction,
    sync,
    receive,
    signOperation,
    signRawOperation: () => {
      throw new Error("signRawOperation is not supported");
    },
    broadcast,
    getSerializedAddressParameters,
    validateAddress,
  };
}

export function createBridges(
  signerContext: SignerContext<MinaSigner>,
  coinConfig: MinaCoinConfig,
) {
  setCoinConfig(coinConfig);

  return {
    currencyBridge: buildCurrencyBridge(signerContext),
    accountBridge: buildAccountBridge(signerContext),
  };
}
