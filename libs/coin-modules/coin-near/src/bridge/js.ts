import getAddressWrapper from "@ledgerhq/ledger-wallet-framework/bridge/getAddressWrapper";
import {
  getSerializedAddressParameters,
  makeAccountBridgeReceive,
  updateTransaction,
  makeScanAccounts,
} from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import type { AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import { broadcast } from "../broadcast";
import { NearCoinConfig, setCoinConfig } from "../config";
import { NEAR_DUMMY_ADDRESS } from "../constants";
import { createTransaction } from "../createTransaction";
import { estimateMaxSpendable } from "../estimateMaxSpendable";
import { getTransactionStatus } from "../getTransactionStatus";
import resolver from "../hw-getAddress";
import { preload, hydrate, getPreloadStrategy } from "../preload";
import { prepareTransaction } from "../prepareTransaction";
import { assignToAccountRaw, assignFromAccountRaw } from "../serialization";
import { buildSignOperation } from "../signOperation";
import { NearSigner } from "../signer";
import { sync, getAccountShape } from "../synchronisation";
import type { NearAccount, Transaction, TransactionStatus } from "../types";
import { validateAddress } from "../validateAddress";

export function buildCurrencyBridge(signerContext: SignerContext<NearSigner>): CurrencyBridge {
  const getAddress = resolver(signerContext);

  const scanAccounts = makeScanAccounts({
    getAccountShape,
    getAddressFn: getAddress,
  });

  return {
    preload,
    hydrate,
    getPreloadStrategy,
    scanAccounts,
  };
}

export function buildAccountBridge(
  signerContext: SignerContext<NearSigner>,
): AccountBridge<Transaction, NearAccount, TransactionStatus> {
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
    signRawOperation: () => {
      throw new Error("signRawOperation is not supported");
    },
    broadcast,
    assignToAccountRaw,
    assignFromAccountRaw,
    getSerializedAddressParameters,
    validateAddress,
    getEstimationRecipient: () => NEAR_DUMMY_ADDRESS,
  };
}

export function createBridges(
  signerContext: SignerContext<NearSigner>,
  coinConfig: NearCoinConfig,
) {
  setCoinConfig(coinConfig);

  return {
    currencyBridge: buildCurrencyBridge(signerContext),
    accountBridge: buildAccountBridge(signerContext),
  };
}
