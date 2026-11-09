import { useCallback } from "react";
import type {
  Account,
  AccountBridge,
  Operation,
  SignedOperation,
  TokenAccount,
} from "@ledgerhq/types-live";
import type { SendFlowPorts } from "@features/platform-send-flow";
import { getRecentAddressesStore } from "../../account/index";
import { sendFeatures } from "../../bridge/descriptor/send/features";
import { applyMemoToTransaction } from "../../bridge/descriptor/send/memo";
import { buildGenericTransactionIntent } from "../../bridge/generic-coin-framework/buildIntent";
import { getSponsoredCoinApi } from "../../bridge/generic-coin-framework/sponsored";
import type { GenericTransaction } from "../../bridge/generic-coin-framework/types";
import { getAccountBridge } from "../../bridge/impl";
import { useBridgeSync } from "../../bridge/react/context";
import type { Transaction, TransactionStatus } from "../../generated/types";

declare module "@features/platform-send-flow" {
  interface SendFlowTypeRegistry {
    account: Account;
    tokenAccount: TokenAccount;
    transaction: Transaction;
    transactionStatus: TransactionStatus;
    operation: Operation;
    signedOperation: SignedOperation;
    accountBridge: AccountBridge<Transaction>;
  }
}

function useAccountSync(): ReturnType<SendFlowPorts["useAccountSync"]> {
  const sync = useBridgeSync();
  return useCallback(request => sync({ type: "SYNC_ONE_ACCOUNT", ...request }), [sync]);
}

/** Binds `@features/platform-send-flow` to live-common's bridges, descriptors and stores. */
export const liveCommonSendFlowPorts: SendFlowPorts = {
  sendFeatures,
  getAccountBridge: (account, parentAccount) => getAccountBridge(account, parentAccount),
  applyMemoToTransaction: (family, memoValue, memoType, currentTransaction) =>
    applyMemoToTransaction(family, memoValue, memoType, currentTransaction),
  addRecentAddress: (currencyId, address, ensName) =>
    getRecentAddressesStore().addAddress(currencyId, address, ensName),
  useAccountSync,
  getSponsoredCoinApi: (network, kind) => getSponsoredCoinApi(network, kind),
  buildSponsoredIntent: (family, kind, account, transaction) =>
    // The generic intent builder reads the bridge transaction through its generic shape.
    buildGenericTransactionIntent(
      family,
      kind,
      account,
      transaction as unknown as GenericTransaction,
    ),
};
