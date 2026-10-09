import { ConfidentialError } from "@ledgerhq/coin-evm/confidential";
import { createApi } from "@ledgerhq/coin-evm/api";
import type { EvmContext } from "@ledgerhq/coin-evm/config";
import { getSepoliaRpcUrl } from "./confidentialRuntime";

export type DeviceTransactionExecutor = {
  signAndBroadcast: (transaction: { transaction: string }) => Promise<string>;
  waitForConfirmation: (hash: string) => Promise<void>;
};

/** Signs an unsigned serialized transaction on the device; resolves to its signature. */
export type SignTransaction = (unsignedTransaction: string) => Promise<string>;

const RECEIPT_POLL_MS = 3000;
const RECEIPT_TIMEOUT_MS = 5 * 60 * 1000;

const wait = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

/** The fields of an `eth_getTransactionReceipt` result this feature reads, as the node returns them. */
export type RpcReceipt = {
  transactionHash: string;
  blockNumber: string;
  from: string;
  status: string;
  logs: { address: string; topics: string[]; data: string }[];
};

type Receipt = RpcReceipt | null;

export async function getReceipt(rpcUrl: string, hash: string): Promise<Receipt> {
  const response = await fetch(rpcUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "eth_getTransactionReceipt",
      params: [hash],
    }),
  });
  const body: { result?: Receipt; error?: { message: string } } = await response.json();
  if (body.error) throw new ConfidentialError("Unknown", body.error.message);
  return body.result ?? null;
}

/**
 * Signs a transaction prepared outside the send flow (ex: an unshield finalize) on the device,
 * broadcasts it through coin-evm and waits for its receipt.
 */
export function createDeviceTransactionExecutor({
  currencyId,
  context,
  signTransaction,
  rpcUrl = getSepoliaRpcUrl(),
  pollMs = RECEIPT_POLL_MS,
  timeoutMs = RECEIPT_TIMEOUT_MS,
}: {
  currencyId: string;
  context: EvmContext;
  signTransaction: SignTransaction;
  rpcUrl?: string;
  pollMs?: number;
  timeoutMs?: number;
}): DeviceTransactionExecutor {
  const api = createApi(currencyId);
  return {
    signAndBroadcast: async ({ transaction }) => {
      const signature = await signTransaction(transaction);
      return api.broadcast(context, api.combine(context, transaction, [signature]));
    },
    waitForConfirmation: async hash => {
      const deadline = Date.now() + timeoutMs;
      for (;;) {
        const receipt = await getReceipt(rpcUrl, hash);
        if (receipt) {
          if (Number(receipt.status) !== 1) {
            throw new ConfidentialError("Unknown", `transaction ${hash} reverted`);
          }
          return;
        }
        if (Date.now() > deadline) {
          throw new ConfidentialError("Unknown", `transaction ${hash} not mined in time`);
        }
        await wait(pollMs);
      }
    },
  };
}
