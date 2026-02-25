import type { Transaction as HederaTransaction, TransactionResponse } from "@hashgraph/sdk";
import { Client } from "@hashgraph/sdk";

let _hederaClientPromise: Promise<Client> | null = null;

async function broadcastTransaction(transaction: HederaTransaction): Promise<TransactionResponse> {
  return transaction.execute(await getInstance());
}

async function createClient(): Promise<Client> {
  const client = await Client.forMainnetAsync();
  client.setMaxNodesPerTransaction(1);
  return client;
}

async function getInstance(): Promise<Client> {
  _hederaClientPromise ??= createClient().catch(error => {
    _hederaClientPromise = null;
    throw error;
  });

  return _hederaClientPromise;
}

// for testing purposes only, used to reset singleton client instance
async function _resetInstance() {
  try {
    const client = await _hederaClientPromise;
    client?.close();
  } catch {
    // intentionally ignored during clean up
  } finally {
    _hederaClientPromise = null;
  }
}

export const rpcClient = {
  getInstance,
  broadcastTransaction,
  _resetInstance,
};
