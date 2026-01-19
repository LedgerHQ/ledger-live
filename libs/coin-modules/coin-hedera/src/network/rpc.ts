import type { Transaction as HederaTransaction, TransactionResponse } from "@hashgraph/sdk";
import { Client } from "@hashgraph/sdk";
import { type HederaCoinConfig } from "../config";
import { resolveConfig } from "../logic/utils";

function broadcastTransaction({
  configOrCurrencyId,
  transaction,
}: {
  configOrCurrencyId: HederaCoinConfig | string;
  transaction: HederaTransaction;
}): Promise<TransactionResponse> {
  return transaction.execute(getInstance(configOrCurrencyId));
}

const _hederaClients: Map<string, Client> = new Map();

function getInstance(configOrCurrencyId: HederaCoinConfig | string): Client {
  const { networkType } = resolveConfig(configOrCurrencyId);

  if (!_hederaClients.has(networkType)) {
    const client = networkType === "mainnet" ? Client.forMainnet() : Client.forTestnet();
    _hederaClients.set(networkType, client.setMaxNodesPerTransaction(1));
  }

  return _hederaClients.get(networkType)!;
}

// for testing purposes only, used to reset singleton client instances
function _resetInstance() {
  _hederaClients.forEach(client => client.close());
  _hederaClients.clear();
}

export const rpcClient = {
  getInstance,
  broadcastTransaction,
  _resetInstance,
};
