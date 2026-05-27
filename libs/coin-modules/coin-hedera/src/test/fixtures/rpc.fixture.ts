import { Client } from "@hashgraph/sdk";
import type { rpcClient } from "../../network/rpc";

type MockedRpcClient = Record<keyof typeof rpcClient, unknown>;

/**
 * Returns a minimal rpcClient for use in jest.mock("../network/rpc") factories.
 * Client.forMainnet() uses a static node list — unlike forMainnetAsync(), it makes no network calls.
 */
export const getMockedRpcClient = (): MockedRpcClient => {
  let client: Client | null = null;

  const getOrCreate = () => {
    client ??= Client.forMainnet().setMaxNodesPerTransaction(1);
    return client;
  };

  return {
    getInstance: async () => getOrCreate(),
    broadcastTransaction: async () => ({}),
    _resetInstance: async () => {
      client?.close();
      client = null;
    },
  };
};
