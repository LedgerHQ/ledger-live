import type { Transaction as HederaTransaction, TransactionResponse } from "@hashgraph/sdk";
import { Client } from "@hashgraph/sdk";

function broadcastTransaction(transaction: HederaTransaction): Promise<TransactionResponse> {
  return transaction.execute(getClient());
}

let _hederaClient: Client | null = null;

function getClient(): Client {
  _hederaClient ??= Client.forMainnet().setMaxNodesPerTransaction(1);

  //_hederaClient.setNetwork({ mainnet: "https://hedera.coin.ledger.com" });

  return _hederaClient;
}

// for testing purposes only, used to reset singleton client instance
function _resetClient() {
  _hederaClient = null;
}

export const hederaClient = {
  broadcastTransaction,
  _resetClient,
};
