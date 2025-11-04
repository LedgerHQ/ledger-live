import type { Transaction as HederaTransaction, TransactionResponse } from "@hashgraph/sdk";
import { Client } from "@hashgraph/sdk";

function broadcastTransaction(transaction: HederaTransaction): Promise<TransactionResponse> {
  return transaction.execute(getInstance());
}

let _hederaClient: Client | null = null;

function getInstance(): Client {
  _hederaClient ??= Client.forMainnet().setMaxNodesPerTransaction(1);

  return _hederaClient;
}

// for testing purposes only, used to reset singleton client instance
function _resetInstance() {
  _hederaClient = null;
}

export const rpcClient = {
  getInstance,
  broadcastTransaction,
  _resetInstance,
};
