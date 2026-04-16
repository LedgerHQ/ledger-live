import network from "@ledgerhq/live-network/network";
import coinConfig from "../config";

const getRpcUrl = () => coinConfig.getCoinConfig().rpcUrl;

// pathUSD fee token contract address
const PATHUSD_ADDRESS = "0x20c0000000000000000000000000000000000000";

// ERC-20 / TIP-20 balanceOf(address) selector
const BALANCE_OF_SELECTOR = "0x70a08231";

/**
 * Encode an address into a 32-byte ABI parameter (left-padded with zeros).
 */
function encodeAddress(address: string): string {
  return address.replace("0x", "").toLowerCase().padStart(64, "0");
}

/**
 * JSON-RPC helper — sends a single request and returns the result field.
 */
async function rpcCall<T>(method: string, params: unknown[]): Promise<T> {
  const { data } = await network<{ result: T; error?: { message: string } }>({
    method: "POST",
    url: getRpcUrl(),
    data: {
      jsonrpc: "2.0",
      id: 1,
      method,
      params,
    },
  });

  if (data.error) {
    throw new Error(`RPC error: ${data.error.message}`);
  }

  return data.result;
}

/**
 * Get the pathUSD (TIP-20) balance for an address.
 * Since Tempo has no native gas token, the "main" balance is the fee token balance.
 */
export async function getBalance(address: string): Promise<bigint> {
  const callData = BALANCE_OF_SELECTOR + encodeAddress(address);
  const result = await rpcCall<string>("eth_call", [
    {
      to: PATHUSD_ADDRESS,
      data: callData,
    },
    "latest",
  ]);

  return BigInt(result);
}

/**
 * Get the transaction count (nonce) for an address.
 */
export async function getNonce(address: string): Promise<number> {
  const result = await rpcCall<string>("eth_getTransactionCount", [address, "latest"]);
  return Number(BigInt(result));
}

/**
 * Get the current block height.
 */
export async function getBlockHeight(): Promise<number> {
  const result = await rpcCall<string>("eth_blockNumber", []);
  return Number(BigInt(result));
}

/**
 * Broadcast a signed transaction.
 * Returns the transaction hash.
 */
export async function broadcastTransaction(rawTx: string): Promise<string> {
  return rpcCall<string>("eth_sendRawTransaction", [rawTx]);
}

/**
 * Estimate gas for a transaction.
 */
export async function estimateGas(
  from: string,
  to: string,
  data?: string,
): Promise<number> {
  const result = await rpcCall<string>("eth_estimateGas", [
    {
      from,
      to,
      data: data || "0x",
    },
  ]);
  return Number(BigInt(result));
}
