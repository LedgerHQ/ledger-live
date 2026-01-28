import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import network from "@ledgerhq/live-network";
import type { LiveNetworkRequest } from "@ledgerhq/live-network/network";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { Operation } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { decodeMemoFromCbor } from "../common-logic/utils";
import coinConfig from "../config";
import type {
  AccountBalanceResponse,
  AccountTransactionsResponse,
  IdentityProvider,
  PublicKeyAccountsResponse,
  SubmitCredentialData,
  SubmitTransferRequest,
  TransactionQueryParams,
  TransactionType,
  WalletProxyTransaction,
} from "../types/network";

interface ProxyClient {
  baseUrl: string;
  request<TResponse, TRequest = unknown>(config: LiveNetworkRequest<TRequest>): Promise<TResponse>;
}

const PROXY_TIMEOUT = 30000;
const DEFAULT_RETRIES = 1;
const RETRY_DELAY = 1000;

function getProxyUrl(currency: CryptoCurrency): string {
  const config = coinConfig.getCoinConfig(currency);
  return config.proxyUrl;
}

function createProxyClient(currency: CryptoCurrency): ProxyClient {
  const baseUrl = getProxyUrl(currency);

  const request = async <TResponse, TRequest = unknown>(
    config: LiveNetworkRequest<TRequest>,
  ): Promise<TResponse> => {
    if (!config.url) {
      throw new Error("URL is required for proxy client requests");
    }
    const response = await network<TResponse, TRequest>({
      ...config,
      url: `${baseUrl}${config.url}`,
      timeout: PROXY_TIMEOUT,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...config.headers,
      },
    });
    return response.data;
  };

  return { baseUrl, request };
}

const CLIENTS_BY_CURRENCY = new Map<CryptoCurrency["id"], ProxyClient>();

function getClient(currency: CryptoCurrency): ProxyClient {
  const existing = CLIENTS_BY_CURRENCY.get(currency.id);
  if (existing) return existing;

  const client = createProxyClient(currency);
  CLIENTS_BY_CURRENCY.set(currency.id, client);
  return client;
}

/**
 * Executes a function with a proxy client, handling retries and error handling
 *
 * @param currency - The Concordium currency
 * @param execute - Function to execute with the client
 * @param retries - Number of retries (default: 3)
 * @returns Result of the execute function
 */
export async function withClient<T>(
  currency: CryptoCurrency,
  execute: (client: ProxyClient) => Promise<T>,
  retries = DEFAULT_RETRIES,
): Promise<T> {
  const client = getClient(currency);

  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await execute(client);
    } catch (e) {
      lastError = e;
      if (attempt < retries) {
        await delay(RETRY_DELAY);
      }
    }
  }

  throw lastError;
}

/**
 * Retrieves all accounts associated with a given public key from the Concordium network.
 *
 * @param currency - The cryptocurrency configuration for the Concordium network
 * @param publicKey - The public key to query for associated accounts
 * @returns A promise that resolves to a response containing the list of accounts associated with the public key
 */
export function getAccountsByPublicKey(
  currency: CryptoCurrency,
  publicKey: string,
): Promise<PublicKeyAccountsResponse> {
  return withClient(currency, async client =>
    client.request<PublicKeyAccountsResponse>({
      method: "GET",
      url: `/v0/keyAccounts/${publicKey}`,
    }),
  );
}

/**
 * Get account balance (v2) - includes CCD and PLT balances with cooldowns
 * GET /v2/accBalance/{address}
 */
export async function getAccountBalance(
  currency: CryptoCurrency,
  accountAddress: string,
): Promise<AccountBalanceResponse> {
  return withClient(currency, async client =>
    client.request<AccountBalanceResponse>({
      method: "GET",
      url: `/v2/accBalance/${accountAddress}`,
    }),
  );
}

/**
 * Get account nonce (next sequence number)
 * GET /v0/accNonce/{address}
 */
export async function getAccountNonce(
  currency: CryptoCurrency,
  accountAddress: string,
): Promise<{ nonce: number }> {
  return withClient(currency, async client =>
    client.request<{ nonce: number }>({
      method: "GET",
      url: `/v0/accNonce/${accountAddress}`,
    }),
  );
}

/**
 * Get account transactions (v3) - includes CCD and PLT transactions
 * GET /v3/accTransactions/{address}
 */
export async function getTransactions(
  currency: CryptoCurrency,
  accountAddress: string,
  params?: TransactionQueryParams,
): Promise<AccountTransactionsResponse> {
  return withClient(currency, async client =>
    client.request<AccountTransactionsResponse>({
      method: "GET",
      url: `/v3/accTransactions/${accountAddress}`,
      params,
    }),
  );
}

/**
 * Get transaction submission status
 * GET /v0/submissionStatus/{submissionId}
 */
export async function getSubmissionStatus(
  currency: CryptoCurrency,
  submissionId: string,
): Promise<{
  status: "committed" | "finalized" | "absent";
}> {
  return withClient(currency, async client =>
    client.request<{
      status: "committed" | "finalized" | "absent";
    }>({
      method: "GET",
      url: `/v0/submissionStatus/${submissionId}`,
    }),
  );
}

/**
 * Calculate transaction cost
 * GET /v0/transactionCost
 */
export async function getTransactionCost(
  currency: CryptoCurrency,
  type: TransactionType,
  numSignatures: number,
): Promise<{ cost: string; energy: string }> {
  return withClient(currency, async client =>
    client.request<{ cost: string; energy: string }>({
      method: "GET",
      url: "/v0/transactionCost",
      params: { type, numSignatures },
    }),
  );
}

/**
 * Get list of identity providers (v2)
 * GET /v2/ip_info
 */
export async function getIdentityProviders(currency: CryptoCurrency): Promise<IdentityProvider[]> {
  return withClient(currency, async client =>
    client.request<IdentityProvider[]>({
      method: "GET",
      url: "/v2/ip_info",
    }),
  );
}

/**
 * Submit a signed transfer transaction to the network
 * PUT /v0/submitTransfer/
 *
 * @param currency - The Concordium currency
 * @param transactionBody - The hex-encoded transaction body
 * @param signature - The hex-encoded signature
 * @returns Submission ID that can be used to check status via getSubmissionStatus
 */
export async function submitTransfer(
  currency: CryptoCurrency,
  transactionBody: string,
  signature: string,
): Promise<{ submissionId: string }> {
  return withClient(currency, async client => {
    const request: LiveNetworkRequest<SubmitTransferRequest> = {
      method: "PUT",
      url: "/v0/submitTransfer/",
      data: {
        transaction: transactionBody,
        signatures: {
          "0": {
            // credential index 0
            "0": signature, // key index 0
          },
        },
      },
    };
    return client.request<{ submissionId: string }, SubmitTransferRequest>(request);
  });
}

/**
 * Submit a credential deployment transaction to the network
 * PUT /v0/submitCredential/
 *
 * @param currency - The Concordium currency
 * @param data - The credential deployment data in proxy format
 * @returns Submission ID that can be used to check status via getSubmissionStatus
 */
export async function submitCredential(
  currency: CryptoCurrency,
  data: SubmitCredentialData,
): Promise<{ submissionId: string }> {
  return withClient(currency, async client => {
    const request: LiveNetworkRequest<SubmitCredentialData> = {
      method: "PUT",
      url: "/v0/submitCredential/",
      data: data,
    };

    return client.request<{ submissionId: string }, SubmitCredentialData>(request);
  });
}

/**
 * Submit a raw transaction to the network
 * PUT /v0/submitRawTransaction/
 *
 * @param currency - The Concordium currency
 * @param rawTransaction - The raw serialized transaction (hex-encoded)
 * @returns Submission ID that can be used to check status via getSubmissionStatus
 */
export async function submitRawTransaction(
  currency: CryptoCurrency,
  rawTransaction: string,
): Promise<{ submissionId: string }> {
  return withClient(currency, async client => {
    const buffer = Buffer.from(rawTransaction, "hex");
    const arrayBuffer = buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength,
    );
    const request: LiveNetworkRequest<ArrayBuffer> = {
      method: "PUT",
      url: "/v0/submitRawTransaction/",
      data: arrayBuffer,
      headers: {
        "Content-Type": "application/octet-stream",
      },
    };
    return client.request<{ submissionId: string }, ArrayBuffer>(request);
  });
}

/**
 * Convert wallet-proxy transaction to Operation format
 */
function operationAdapter(
  tx: WalletProxyTransaction,
  accountAddress: string,
  accountId: string,
): Operation | null {
  if (tx.details.type !== "transfer" && tx.details.type !== "transferWithMemo") {
    return null;
  }

  const transferSource = tx.details.transferSource || "";
  const transferDestination = tx.details.transferDestination || "";

  const isOutgoing = transferSource === accountAddress;
  const isIncoming = transferDestination === accountAddress;

  // Transactions with details.outcome other than "completed" are ignored,
  // since they have neither source nor destination
  if (!isOutgoing && !isIncoming) {
    return null;
  }

  const type = isOutgoing ? "OUT" : "IN";
  const transferAmount = tx.details.transferAmount || "0";
  const feeValue = new BigNumber(tx.cost || 0);
  let value = new BigNumber(transferAmount);

  if (isOutgoing) {
    value = value.plus(feeValue);
  }

  const extra: Record<string, unknown> = {};
  if (tx.details.memo) {
    extra.memo = decodeMemoFromCbor(tx.details.memo);
  }

  return {
    id: encodeOperationId(accountId, tx.transactionHash, type),
    hash: tx.transactionHash,
    accountId,
    type,
    value,
    fee: feeValue,
    blockHash: tx.blockHash || null,
    blockHeight: 0, // wallet-proxy doesn't provide block height
    senders: [transferSource],
    recipients: [transferDestination],
    date: new Date(Math.floor(tx.blockTime) * 1000),
    transactionSequenceNumber: new BigNumber(tx.id),
    extra,
  };
}

/**
 * Filters and converts wallet-proxy transactions to Ledger Live Operation format
 */
export async function getOperations(
  currency: CryptoCurrency,
  address: string,
  accountId: string,
  params: { from: number; size?: number },
): Promise<Operation[]> {
  try {
    const proxyParams: TransactionQueryParams = {
      limit: params.size || 100,
      order: "d", // descending to get latest first
    };

    const response = await getTransactions(currency, address, proxyParams);

    if (!isAccountTransactionsResponse(response)) {
      return [];
    }

    const minSequenceNumber = params.from > 0 ? params.from : 0;

    const operations = response.transactions
      .map(tx => operationAdapter(tx, address, accountId))
      .filter((op): op is Operation => {
        if (op === null) return false;
        if (minSequenceNumber > 0) {
          const seqNum = op.transactionSequenceNumber?.toNumber() ?? 0;
          return seqNum >= minSequenceNumber;
        }
        return true;
      });

    return operations;
  } catch (_error) {
    return [];
  }
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isAccountTransactionsResponse(value: unknown): value is AccountTransactionsResponse {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const obj = value as Record<string, unknown>;
  return "transactions" in obj && Array.isArray(obj.transactions);
}
