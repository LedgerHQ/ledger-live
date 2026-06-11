import type { Transaction as HederaTransaction, TransactionResponse } from "@hashgraph/sdk";
import { Client } from "@hashgraph/sdk";
import type { HederaCoinConfig } from "../config";
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

function getClientCacheKey(config: HederaCoinConfig): string {
  if (config.sdkClientOptions) {
    return `${config.networkType}:${JSON.stringify(config.sdkClientOptions)}`;
  }

  return config.networkType;
}

function applySdkClientOptions(client: Client, config: HederaCoinConfig): void {
  if (typeof config.sdkClientOptions?.maxAttempts === "number") {
    client.setMaxAttempts(config.sdkClientOptions.maxAttempts);
  }
  if (typeof config.sdkClientOptions?.requestTimeout === "number") {
    client.setRequestTimeout(config.sdkClientOptions.requestTimeout);
  }
  if (typeof config.sdkClientOptions?.minBackoff === "number") {
    client.setMinBackoff(config.sdkClientOptions.minBackoff);
  }
  if (typeof config.sdkClientOptions?.maxBackoff === "number") {
    client.setMaxBackoff(config.sdkClientOptions.maxBackoff);
  }
}

async function createClient(config: HederaCoinConfig): Promise<Client> {
  const client =
    config.networkType === "mainnet"
      ? await Client.forMainnetAsync()
      : await Client.forTestnetAsync();

  // limit max nodes per transaction to 1 to avoid multiple signatures
  client.setMaxNodesPerTransaction(1);
  applySdkClientOptions(client, config);

  return client;
}

async function getInstance(configOrCurrencyId: HederaCoinConfig | string): Promise<Client> {
  const config = resolveConfig(configOrCurrencyId);
  const cacheKey = getClientCacheKey(config);

  if (!_hederaClients.has(cacheKey)) {
    const promise = createClient(config).catch(error => {
      _hederaClients.delete(cacheKey);
      throw error;
    });

    _hederaClients.set(cacheKey, promise);
  }

  return _hederaClients.get(cacheKey)!;
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
