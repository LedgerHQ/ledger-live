import getAddressWrapper from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import {
  defaultUpdateTransaction,
  makeAccountBridgeReceive,
  makeScanAccounts,
  makeSync,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import type { AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import signerGetAddress from "../signer";
import createTransaction from "./createTransaction";
import { estimateMaxSpendable, getTransactionStatus, getAccountShape, broadcast } from "../logic";
import prepareTransaction from "./prepareTransaction";
import buildSignOperation from "./signOperation";
import {
  assignFromAccountRaw,
  assignToAccountRaw,
  fromOperationExtraRaw,
  toOperationExtraRaw,
} from "./serialization";
import { getPreloadStrategy, hydrate, preload } from "./preload";
import type { PolkadotAddress, PolkadotSignature, Transaction } from "../types";
import { PolkadotSigner } from "../types";

export function buildCurrencyBridge(
  signerContext: SignerContext<PolkadotSigner, PolkadotAddress | PolkadotSignature>,
): CurrencyBridge {
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

export function buildAccountBridge(
  signerContext: SignerContext<PolkadotSigner, PolkadotAddress | PolkadotSignature>,
): AccountBridge<Transaction> {
  const getAddress = signerGetAddress(signerContext);

  const receive = makeAccountBridgeReceive(getAddressWrapper(getAddress));
  const signOperation = buildSignOperation(signerContext);
  const sync = makeSync({ getAccountShape });

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
    assignFromAccountRaw,
    assignToAccountRaw,
    fromOperationExtraRaw,
    toOperationExtraRaw,
  };
}

export function createBridges(
  signerContext: SignerContext<PolkadotSigner, PolkadotAddress | PolkadotSignature>,
) {
  return {
    currencyBridge: buildCurrencyBridge(signerContext),
    accountBridge: buildAccountBridge(signerContext),
  };
}
