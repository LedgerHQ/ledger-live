import {
  defaultUpdateTransaction,
  makeAccountBridgeReceive,
  makeScanAccounts,
  makeSync,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";
import getAddressWrapper from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import type { Transaction } from "../types";
import { makeGetAccountShape } from "../js-synchronisation";
import estimateMaxSpendable from "../js-estimateMaxSpendable";
import { createTransaction, prepareTransaction } from "../js-transaction";
import getTransactionStatus from "../js-getTransactionStatus";
import buildSignOperation from "../js-signOperation";
import broadcast from "../js-broadcast";
import type { AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import { assignToAccountRaw, assignFromAccountRaw } from "../serialization";
import {
  CardanoAddress,
  CardanoExtendedPublicKey,
  CardanoSignature,
  CardanoSigner,
} from "../signer";
import resolver from "../hw-getAddress";
import postSyncPatch from "../postSyncPatch";

export function buildCurrencyBridge(
  signerContext: SignerContext<
    CardanoSigner,
    CardanoAddress | CardanoExtendedPublicKey | CardanoSignature
  >,
): CurrencyBridge {
  const getAddress = resolver(signerContext);
  const scanAccounts = makeScanAccounts({
    getAccountShape: makeGetAccountShape(signerContext),
    getAddressFn: getAddressWrapper(getAddress),
  });

  return {
    scanAccounts,
    preload: async () => ({}),
    hydrate: () => {},
  };
}

export function buildAccountBridge(
  signerContext: SignerContext<
    CardanoSigner,
    CardanoAddress | CardanoExtendedPublicKey | CardanoSignature
  >,
): AccountBridge<Transaction> {
  const sync = makeSync({
    getAccountShape: makeGetAccountShape(signerContext),
    postSync: postSyncPatch,
  });

  const getAddress = resolver(signerContext);

  const receive = makeAccountBridgeReceive(getAddressWrapper(getAddress));

  return {
    estimateMaxSpendable,
    createTransaction,
    updateTransaction: defaultUpdateTransaction,
    getTransactionStatus,
    prepareTransaction,
    sync,
    receive,
    signOperation: buildSignOperation(signerContext),
    broadcast,
    assignToAccountRaw,
    assignFromAccountRaw,
  };
}

export function createBridges(
  signerContext: SignerContext<
    CardanoSigner,
    CardanoAddress | CardanoExtendedPublicKey | CardanoSignature
  >,
) {
  return {
    currencyBridge: buildCurrencyBridge(signerContext),
    accountBridge: buildAccountBridge(signerContext),
  };
}
