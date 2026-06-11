import type { Transaction as HederaTransaction, TransactionResponse } from "@hashgraph/sdk";
import { Client } from "@hashgraph/sdk";
import { type HederaCoinConfig } from "../config";
import { resolveConfig } from "../logic/utils";

async function broadcastTransaction({
  configOrCurrencyId,
  transaction,
}: {
  configOrCurrencyId: HederaCoinConfig | string;
  transaction: HederaTransaction;
}): Promise<TransactionResponse> {
  return transaction.execute(await getInstance(configOrCurrencyId));
}

const _hederaClients: Map<string, Promise<Client>> = new Map();

async function createClient(networkType: string): Promise<Client> {
  const client =
    networkType === "mainnet" ? await Client.forMainnetAsync() : await Client.forTestnetAsync();

  // limit max nodes per transaction to 1 to avoid multiple signatures
  client.setMaxNodesPerTransaction(1);

  return client;
}

async function getInstance(configOrCurrencyId: HederaCoinConfig | string): Promise<Client> {
  const { networkType } = resolveConfig(configOrCurrencyId);

  if (!_hederaClients.has(networkType)) {
    const promise = createClient(networkType).catch(error => {
      _hederaClients.delete(networkType);
      throw error;
    });

    _hederaClients.set(networkType, promise);
  }

  return _hederaClients.get(networkType)!;
}

// for testing purposes only, used to reset singleton client instances
async function _resetInstance() {
  const promises = [..._hederaClients.values()];

  for (const promise of promises) {
    try {
      const client = await promise;
      client?.close();
    } catch {
      // intentionally ignored during clean up
    }
  }

  _hederaClients.clear();
}

export const rpcClient = {
  getInstance,
  broadcastTransaction,
  _resetInstance,
};
