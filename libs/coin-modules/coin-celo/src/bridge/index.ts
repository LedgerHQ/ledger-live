import type { AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import {
  getSerializedAddressParameters,
  updateTransaction,
  makeAccountBridgeReceive,
  makeScanAccounts,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { getPreloadStrategy, preload, hydrate } from "./preload";
import { getTransactionStatus } from "./getTransactionStatus";
import { estimateMaxSpendable } from "./estimateMaxSpendable";
import { prepareTransaction } from "./prepareTransaction";
import { createTransaction } from "./createTransaction";
import {
  assignFromAccountRaw,
  assignToAccountRaw,
  toOperationExtraRaw,
  fromOperationExtraRaw,
} from "./serialization";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import resolver from "../signer/hw-getAddress";
import type { CeloAccount, Transaction, TransactionStatus } from "../types";
import { broadcast } from "./broadcast";

import getAddressWrapper from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import { getAccountShape } from "./synchronisation";
import { buildSignOperation } from "./signOperation";
import { sync } from "./synchronisation";
import { CeloSigner } from "../signer/signer";
import { validateAddress } from "./validateAddress";

export function buildCurrencyBridge(signerContext: SignerContext<CeloSigner>): CurrencyBridge {
  const getAddress = resolver(signerContext);
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
  signerContext: SignerContext<CeloSigner>,
): AccountBridge<Transaction, CeloAccount, TransactionStatus> {
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
    getSerializedAddressParameters,
    assignFromAccountRaw,
    assignToAccountRaw,
    toOperationExtraRaw,
    fromOperationExtraRaw,
    validateAddress,
  };
}

export function createBridges(signerContext: SignerContext<CeloSigner>) {
  return {
    currencyBridge: buildCurrencyBridge(signerContext),
    accountBridge: buildAccountBridge(signerContext),
  };
}
