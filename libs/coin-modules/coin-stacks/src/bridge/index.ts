// import { currencyBridge } from "./currency";
// import { accountBridge } from "./account";

// export default {
//   currencyBridge,
//   accountBridge,
// };

// --- OLD ^^
import { makeAccountBridgeReceive, makeScanAccounts, makeSync } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import resolver from "../signer/index";
import getAddressWrapper from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import type { Account, AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import { defaultUpdateTransaction } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import type { Transaction, TransactionStatus, StacksSigner } from "../types";
import { getTransactionStatus } from "../getTransactionStatus";
import { estimateMaxSpendable } from "../estimateMaxSpendable";
import { prepareTransaction } from "../prepareTransaction";
import { createTransaction } from "../createTransaction";
import { getAccountShape } from "../synchronization";
import { buildSignOperation } from "../signOperation";
import { broadcast } from "../broadcast";

function buildCurrencyBridge(signerContext: SignerContext<StacksSigner>): CurrencyBridge {
  const getAddress = resolver(signerContext);


  const scanAccounts = makeScanAccounts({
    getAccountShape,
    getAddressFn: getAddressWrapper(getAddress),
  });

  return {
    preload: () => Promise.resolve({}),
    hydrate: () => {},
    scanAccounts,
  };
}

const sync = makeSync({ getAccountShape });

function buildAccountBridge(
  signerContext: SignerContext<StacksSigner>,
): AccountBridge<Transaction, Account, TransactionStatus> {
  const getAddress = resolver(signerContext);
  const receive = makeAccountBridgeReceive(getAddressWrapper(getAddress));

  const signOperation = buildSignOperation(signerContext);

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
  };
}

export function createBridges(signerContext: SignerContext<StacksSigner>) {
  return {
    currencyBridge: buildCurrencyBridge(signerContext),
    accountBridge: buildAccountBridge(signerContext),
  };
}
export { prepareTransaction, estimateMaxSpendable };
/// XRP
// import getAddressWrapper from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
// import {
//   defaultUpdateTransaction,
//   makeAccountBridgeReceive,
//   makeScanAccounts,
//   makeSync,
// } from "@ledgerhq/coin-framework/bridge/jsHelpers";
// import { CoinConfig } from "@ledgerhq/coin-framework/config";
// import { SignerContext } from "@ledgerhq/coin-framework/signer";
// import type { AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
// import CoinConfig, { type XrpCoinConfig } from "../config";
// import resolver from "../signer";
// import { XrpSigner } from "../types";
// import type { Transaction } from "../types";
// import { broadcast } from "./broadcast";
// import { createTransaction } from "./createTransaction";
// import { estimateMaxSpendable } from "./estimateMaxSpendable";
// import { getTransactionStatus } from "./getTransactionStatus";
// import { prepareTransaction } from "./prepareTransaction";
// import { buildSignOperation } from "./signOperation";
// import { getAccountShape } from "./synchronization";



// export function buildCurrencyBridge(signerContext: SignerContext<XXXSigner, XXXAddress | XXXSignature>): CurrencyBridge {
//   const getAddress = resolver(signerContext);
//   const scanAccounts = makeScanAccounts({
//     getAccountShape,
//     getAddressFn: getAddress,
//   });
//   return {
//     getPreloadStrategy,
//     preload,
//     hydrate,
//     scanAccounts,
//   }
// }
// export function buildAccountBridge(signerContext: SignerContext<XXXSigner, XXXAddress | XXXSignature>): AccountBridge<Transaction> {
//   const getAddress = resolver(signerContext);
//   const receive = makeAccountBridgeReceive(getAddressWrapper(getAddress));
//   const signOperation = buildSignOperation(signerContext);
//   return {
//     estimateMaxSpendable,
//     createTransaction,
//     updateTransaction,
//     getTransactionStatus,
//     prepareTransaction,
//     sync,
//     receive,
//     signOperation,
//     broadcast,
//   }
// }
// export function createBridges(
//   signerContext: SignerContext<XXXSigner, XXXAddress | XXXSignature>,
// ) {
//   return {
//     currencyBridge: buildCurrencyBridge(signerContext),
//     accountBridge: buildAccountBridge(signerContext),
//   };
// }


/