import {
  getSerializedAddressParameters,
  makeScanAccounts,
  makeSync,
  updateTransaction,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";
import getAddressWrapper from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import type { SignerContext } from "@ledgerhq/coin-framework/signer";
import type { AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import { broadcast } from "./broadcast";
import { createTransaction } from "./createTransaction";
import { estimateMaxSpendable } from "./estimateMaxSpendable";
import { getTransactionStatus } from "./getTransactionStatus";
import { prepareTransaction } from "./prepareTransaction";
import { receive } from "./receive";
import { getPreloadStrategy, hydrate, preload } from "../preload";
import { buildSignOperation } from "./signOperation";
import { getAccountShape, buildIterateResult, postSync } from "./synchronisation";
import { assignFromAccountRaw, assignToAccountRaw } from "./serialization";
import resolver from "../signer/index";
import type { Transaction, TransactionStatus, HederaSigner, HederaAccount } from "../types";
import { validateAddress } from "./validateAddress";

function buildCurrencyBridge(signerContext: SignerContext<HederaSigner>): CurrencyBridge {
  const getAddress = resolver(signerContext);

  const scanAccounts = makeScanAccounts({
    getAccountShape,
    buildIterateResult,
    getAddressFn: getAddressWrapper(getAddress),
  });

  return {
    preload,
    hydrate,
    getPreloadStrategy,
    scanAccounts,
  };
}

const sync = makeSync({ getAccountShape, postSync, shouldMergeOps: false });

function buildAccountBridge(
  signerContext: SignerContext<HederaSigner>,
): AccountBridge<Transaction, HederaAccount, TransactionStatus> {
  const getAddress = resolver(signerContext);

  const signOperation = buildSignOperation(signerContext);

  return {
    estimateMaxSpendable,
    createTransaction,
    updateTransaction,
    getTransactionStatus,
    prepareTransaction,
    assignToAccountRaw,
    assignFromAccountRaw,
    sync,
    receive: receive(getAddressWrapper(getAddress)),
    signOperation,
    signRawOperation: () => {
      throw new Error("signRawOperation is not supported");
    },
    broadcast,
    getSerializedAddressParameters,
    validateAddress,
  };
}

export function createBridges(signerContext: SignerContext<HederaSigner>) {
  return {
    currencyBridge: buildCurrencyBridge(signerContext),
    accountBridge: buildAccountBridge(signerContext),
  };
}
