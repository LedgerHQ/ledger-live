import getAddressWrapper from "@ledgerhq/ledger-wallet-framework/bridge/getAddressWrapper";
import {
  getSerializedAddressParameters,
  updateTransaction,
  makeAccountBridgeReceive,
  makeScanAccounts,
  makeSync,
} from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import type { AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import { buildBroadcast } from "../broadcast";
import type { CardanoContext } from "../config";
import { CARDANO_DUMMY_ADDRESS } from "../constants";
import { createTransaction } from "../createTransaction";
import { buildEstimateMaxSpendable } from "../estimateMaxSpendable";
import { buildGetTransactionStatus } from "../getTransactionStatus/getTransactionStatus";
import resolver from "../hw-getAddress";
import { postSyncPatch } from "../postSyncPatch";
import { buildPrepareTransaction } from "../prepareTransaction";
import { assignToAccountRaw, assignFromAccountRaw } from "../serialization";
import { buildSignOperation } from "../signOperation";
import { CardanoSigner } from "../signer";
import { makeGetAccountShape } from "../synchronisation";
import type { CardanoAccount, Transaction, TransactionStatus } from "../types";
import { validateAddress } from "../validateAddress";

export function buildCurrencyBridge(
  signerContext: SignerContext<CardanoSigner>,
  context: CardanoContext,
): CurrencyBridge {
  const getAddress = resolver(signerContext);
  const scanAccounts = makeScanAccounts({
    getAccountShape: makeGetAccountShape(signerContext, context),
    getAddressFn: getAddressWrapper(getAddress),
    postSync: postSyncPatch,
  });

  return {
    scanAccounts,
  };
}

export function buildAccountBridge(
  signerContext: SignerContext<CardanoSigner>,
  context: CardanoContext,
): AccountBridge<Transaction, CardanoAccount, TransactionStatus> {
  const sync = makeSync({
    getAccountShape: makeGetAccountShape(signerContext, context),
    postSync: postSyncPatch,
  });

  const getAddress = resolver(signerContext);

  const receive = makeAccountBridgeReceive(getAddressWrapper(getAddress));

  return {
    estimateMaxSpendable: buildEstimateMaxSpendable(context),
    createTransaction,
    updateTransaction,
    getTransactionStatus: buildGetTransactionStatus(context),
    prepareTransaction: buildPrepareTransaction(context),
    sync,
    receive,
    signOperation: buildSignOperation(signerContext),
    signRawOperation: () => {
      throw new Error("signRawOperation is not supported");
    },
    broadcast: buildBroadcast(context),
    assignToAccountRaw,
    assignFromAccountRaw,
    getSerializedAddressParameters,
    validateAddress,
    getEstimationRecipient: () => CARDANO_DUMMY_ADDRESS,
  };
}

export function createBridges(
  signerContext: SignerContext<CardanoSigner>,
  context: CardanoContext,
) {
  return {
    currencyBridge: buildCurrencyBridge(signerContext, context),
    accountBridge: buildAccountBridge(signerContext, context),
  };
}
