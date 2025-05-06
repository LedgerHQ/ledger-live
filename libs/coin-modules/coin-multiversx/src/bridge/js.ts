import getAddressWrapper from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import {
  getSerializedAddressParameters,
  makeAccountBridgeReceive,
  makeScanAccounts,
  updateTransaction,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { SignerContext } from "@ledgerhq/coin-framework/lib/signer";
import type { AccountBridge, Bridge, CurrencyBridge } from "@ledgerhq/types-live";
import { broadcast } from "../broadcast";
import { createTransaction } from "../createTransaction";
import { estimateMaxSpendable } from "../estimateMaxSpendable";
import formatters from "../formatters";
import { getTransactionStatus } from "../getTransactionStatus";
import resolver from "../hw-getAddress";
import { getPreloadStrategy, hydrate, preload } from "../preload";
import { prepareTransaction } from "../prepareTransaction";
import {
  assignFromAccountRaw,
  assignToAccountRaw,
  fromOperationExtraRaw,
  toOperationExtraRaw,
} from "../serialization";
import { MultiversXSigner } from "../signer";
import { buildSignOperation } from "../signOperation";
import { getAccountShape, sync } from "../synchronisation";
import { serialiation } from "../transaction";
import type {
  MultiversXAccount,
  MultiversXAccountRaw,
  MultiversXOperationExtra,
  MultiversXOperationExtraRaw,
  Transaction,
  TransactionRaw,
  TransactionStatus,
} from "../types";

function buildCurrencyBridge(signerContext: SignerContext<MultiversXSigner>): CurrencyBridge {
  const getAddress = resolver(signerContext);

  const scanAccounts = makeScanAccounts({
    getAccountShape,
    getAddressFn: getAddress,
  });

  return {
    getPreloadStrategy,
    preload,
    hydrate,
    scanAccounts,
  };
}

function buildAccountBridge(
  signerContext: SignerContext<MultiversXSigner>,
): MultiversXAccountBridge {
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
    assignFromAccountRaw,
    assignToAccountRaw,
    fromOperationExtraRaw,
    toOperationExtraRaw,
    getSerializedAddressParameters,
  };
}

export type MultiversXAccountBridge = AccountBridge<
  Transaction,
  MultiversXAccount,
  TransactionStatus,
  MultiversXAccountRaw,
  MultiversXOperationExtra,
  MultiversXOperationExtraRaw
>;
export type MultiversXBridge = Bridge<
  Transaction,
  TransactionRaw,
  MultiversXAccount,
  MultiversXAccountRaw,
  MultiversXOperationExtra,
  MultiversXOperationExtraRaw
>;

export function createBridges(signerContext: SignerContext<MultiversXSigner>): MultiversXBridge {
  return {
    currencyBridge: buildCurrencyBridge(signerContext),
    accountBridge: buildAccountBridge(signerContext),
    serializationBridge: {
      ...formatters,
      ...serialiation,
    },
  };
}
