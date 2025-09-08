import type { Transaction as HederaTransaction, TransactionResponse } from "@hashgraph/sdk";
import { Client } from "@hashgraph/sdk";
import coinConfig from "../config";

function broadcastTransaction(transaction: HederaTransaction): Promise<TransactionResponse> {
  return transaction.execute(getClient());
}

let _hederaClient: Client | null = null;

function getClient(): Client {
  const network = coinConfig.getCoinConfig().network;

  if (network === "testnet") {
    _hederaClient ??= Client.forTestnet().setMaxNodesPerTransaction(1);
  } else {
    _hederaClient ??= Client.forMainnet().setMaxNodesPerTransaction(1);
  }

  // FIXME: check if this should be enabled or not
  //_hederaClient.setNetwork({ mainnet: "https://hedera.coin.ledger.com" });

  return _hederaClient;
}

// for testing purposes only to reset singleton client instance
function _resetClient() {
  _hederaClient = null;
}

export const hederaClient = {
  broadcastTransaction,
  _resetClient,
};
