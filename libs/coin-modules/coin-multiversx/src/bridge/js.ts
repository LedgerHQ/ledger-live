import getAddressWrapper from "@ledgerhq/ledger-wallet-framework/bridge/getAddressWrapper";
import {
  getSerializedAddressParameters,
  updateTransaction,
  makeAccountBridgeReceive,
  makeScanAccounts,
} from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import type { AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import { broadcast } from "../broadcast";
import { MULTIVERSX_DUMMY_ADDRESS } from "../constants";
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
import { buildSignOperation } from "../signOperation";
import { MultiversXSigner } from "../signer";
import { getAccountShape, sync } from "../synchronisation";
import type {
  MultiversXAccount,
  MultiversXOperation,
  Transaction,
  TransactionStatus,
} from "../types";
import { validateAddress } from "../validateAddress";

export function buildCurrencyBridge(
  signerContext: SignerContext<MultiversXSigner>,
): CurrencyBridge {
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

export function buildAccountBridge(
  signerContext: SignerContext<MultiversXSigner>,
): AccountBridge<Transaction, MultiversXAccount, TransactionStatus, MultiversXOperation> {
  const getAddress = resolver(signerContext);

  const receive = makeAccountBridgeReceive(getAddressWrapper(getAddress));
  const signOperation = buildSignOperation(signerContext);

  return {
    estimateMaxSpendable,
    createTransaction,
    updateTransaction,
    getTransactionStatus,
    getEstimationRecipient: () => MULTIVERSX_DUMMY_ADDRESS,
    prepareTransaction,
    sync,
    receive,
    signOperation,
    signRawOperation: () => {
      throw new Error("signRawOperation is not supported");
    },
    broadcast,
    assignFromAccountRaw,
    assignToAccountRaw,
    fromOperationExtraRaw,
    toOperationExtraRaw,
    formatAccountSpecifics: formatters.formatAccountSpecifics,
    formatOperationSpecifics: formatters.formatOperationSpecifics,
    getSerializedAddressParameters,
    validateAddress,
  };
}

export function createBridges(signerContext: SignerContext<MultiversXSigner>) {
  return {
    currencyBridge: buildCurrencyBridge(signerContext),
    accountBridge: buildAccountBridge(signerContext),
  };
}
