import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { getSerializedAddressParameters } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { Account, AccountBridge, AccountRaw, TransactionStatusCommon } from "@ledgerhq/types-live";
import { AptosSigner, Transaction } from "../types";
import { accountBridge } from "../logic";
import { prepareTransaction } from "../logic/prepareTransaction";
export type { AptosCoinConfig } from "../config";

type T = Transaction; // extend if needed
type A = Account; // extend if needed
type U = TransactionStatusCommon; // extend if needed
type R = AccountRaw; // extend if needed

export function buildAccountBridge(
  signerContext: SignerContext<AptosSigner>,
): AccountBridge<T, A, U, R> {
  return {
    sync: accountBridge.sync<A>,
    receive: accountBridge.receive(signerContext),
    estimateMaxSpendable: accountBridge.estimateMaxSpendable,
    createTransaction: accountBridge.createTransaction,
    // updateTransaction,
    // getTransactionStatus,
    prepareTransaction,
    // signOperation,
    // broadcast,
    // assignFromAccountRaw,
    // assignToAccountRaw,
    // fromOperationExtraRaw,
    // toOperationExtraRaw,
    getSerializedAddressParameters,
  };
}
