import { ConfidentialError } from "@ledgerhq/coin-evm/confidential";
import { createApi } from "@ledgerhq/coin-evm/api";
import type { EvmContext } from "@ledgerhq/coin-evm/config";
import { consumeMockRefusal, DeviceRefusedError, type ConfidentialApi } from "./confidentialApi";
import { getSepoliaRpcUrl, isRealConfidentialApi } from "./confidentialRuntime";

export type ShieldStep = "approve" | "wrap";

export type ShieldTransaction = NonNullable<
  Awaited<ReturnType<ConfidentialApi["prepareShield"]>>["transactions"][number]
>;

export type ShieldExecutor = {
  signAndBroadcast: (step: ShieldStep, transaction: ShieldTransaction) => Promise<string>;
  waitForConfirmation: (hash: string) => Promise<void>;
};

/** Signs an unsigned serialized transaction on the device; resolves to its signature. */
export type SignTransaction = (unsignedTransaction: string) => Promise<string>;

const MOCK_SIGNATURE_DELAY_MS = 1500;
const MOCK_CONFIRMATION_DELAY_MS = 2000;
const RECEIPT_POLL_MS = 3000;
const RECEIPT_TIMEOUT_MS = 5 * 60 * 1000;

const wait = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

const mockTransactionHash = () =>
  `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`;

export const mockShieldExecutor: ShieldExecutor = {
  signAndBroadcast: async () => {
    await wait(MOCK_SIGNATURE_DELAY_MS);
    if (consumeMockRefusal()) throw new DeviceRefusedError();
    return mockTransactionHash();
  },
  waitForConfirmation: () => wait(MOCK_CONFIRMATION_DELAY_MS),
};

type Receipt = { status: string } | null;

async function getReceipt(rpcUrl: string, hash: string): Promise<Receipt> {
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
 * Signs each shield transaction on the device, broadcasts it through coin-evm and waits for its
 * receipt, so wrap is signed only once approve is mined.
 */
export function createDeviceShieldExecutor({
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
}): ShieldExecutor {
  const api = createApi(currencyId);
  return {
    signAndBroadcast: async (_step, { transaction }) => {
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

export const getShieldExecutor = (
  device: Parameters<typeof createDeviceShieldExecutor>[0],
): ShieldExecutor =>
  isRealConfidentialApi() ? createDeviceShieldExecutor(device) : mockShieldExecutor;
