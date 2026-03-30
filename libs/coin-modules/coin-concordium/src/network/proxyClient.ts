import network from "@ledgerhq/live-network";
import type { LiveNetworkRequest } from "@ledgerhq/live-network/network";
import { retry } from "@ledgerhq/live-promise";
import coinConfig from "../config";
import type {
  AccountBalanceResponse,
  BlockInfoResponse,
  BlocksAtHeightResponse,
  ConsensusInfoResponse,
  GetTransactionCostParams,
  TransactionsResponse,
  PublicKeyAccountsResponse,
  SubmitCredentialData,
  SubmitTransferData,
  TransactionQueryParams,
} from "../types";

interface ProxyClient {
  baseUrl: string;
  request<TResponse, TRequest = unknown>(config: LiveNetworkRequest<TRequest>): Promise<TResponse>;
}

const PROXY_TIMEOUT = 30000;
const DEFAULT_RETRIES = 2;
const RETRY_DELAY = 1000;

function createProxyClient(currencyId: string): ProxyClient {
  const baseUrl = coinConfig.getCoinConfig(currencyId).proxyUrl;

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

const CLIENTS_BY_CURRENCY = new Map<string, ProxyClient>();

function getClient(currencyId: string): ProxyClient {
  const existing = CLIENTS_BY_CURRENCY.get(currencyId);
  if (existing) return existing;

  const client = createProxyClient(currencyId);
  CLIENTS_BY_CURRENCY.set(currencyId, client);
  return client;
}

/**
 * Executes a function with a proxy client, handling retries and error handling
 *
 * @param currencyId - The Concordium currency ID
 * @param execute - Function to execute with the client
 * @param retries - Number of retries (default: 2)
 * @returns Result of the execute function
 */
export async function withClient<T>(
  currencyId: string,
  execute: (client: ProxyClient) => Promise<T>,
  retries = DEFAULT_RETRIES,
): Promise<T> {
  const client = getClient(currencyId);

  return retry(() => execute(client), {
    maxRetry: retries,
    interval: RETRY_DELAY,
    intervalMultiplicator: 1,
  });
}

/**
 * Get consensus info from the Concordium network.
 * GET /v0/consensusInfo
 */
export function getConsensusInfo(currencyId: string): Promise<ConsensusInfoResponse> {
  return withClient(currencyId, async client =>
    client.request<ConsensusInfoResponse>({
      method: "GET",
      url: "/v0/consensusInfo",
    }),
  );
}

/**
 * Get block info by block hash.
 * GET /v0/blockInfo/{blockHash}
 */
export function getBlockInfoByHash(
  currencyId: string,
  blockHash: string,
): Promise<BlockInfoResponse> {
  return withClient(currencyId, async client =>
    client.request<BlockInfoResponse>({
      method: "GET",
      url: `/v0/blockInfo/${blockHash}`,
    }),
  );
}

/**
 * Get block hash(es) at a specific height.
 * GET /v0/blocksAtHeight/{blockHeight}
 */
export function getBlocksAtHeight(
  currencyId: string,
  height: number,
): Promise<BlocksAtHeightResponse> {
  return withClient(currencyId, async client =>
    client.request<BlocksAtHeightResponse>({
      method: "GET",
      url: `/v0/blocksAtHeight/${height}`,
    }),
  );
}

/**
 * Retrieves all accounts associated with a given public key from the Concordium network.
 * GET /v0/keyAccounts/{publicKey}
 */
export function getAccountsByPublicKey(
  currencyId: string,
  publicKey: string,
): Promise<PublicKeyAccountsResponse> {
  return withClient(currencyId, async client =>
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
  currencyId: string,
  accountAddress: string,
): Promise<AccountBalanceResponse> {
  return withClient(currencyId, async client =>
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
  currencyId: string,
  accountAddress: string,
): Promise<{ nonce: number }> {
  return withClient(currencyId, async client =>
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
  currencyId: string,
  accountAddress: string,
  params?: TransactionQueryParams,
): Promise<TransactionsResponse> {
  return withClient(currencyId, async client =>
    client.request<TransactionsResponse>({
      method: "GET",
      url: `/v3/accTransactions/${accountAddress}`,
      params,
    }),
  );
}

/**
 * Calculate transaction cost
 * GET /v0/transactionCost
 *
 * Always uses "simpleTransfer" type as it's the only supported type for regular transfers.
 * Memo overhead is calculated via the optional memoSize parameter.
 */
export async function getTransactionCost(
  currencyId: string,
  { numSignatures, memoSize }: GetTransactionCostParams,
): Promise<{ cost: string; energy: number }> {
  return withClient(currencyId, async client =>
    client.request<{ cost: string; energy: number }>({
      method: "GET",
      url: "/v0/transactionCost",
      params: {
        type: "simpleTransfer",
        numSignatures,
        ...(memoSize ? { memoSize } : {}),
      },
    }),
  );
}

/**
 * Submit a signed transfer transaction to the network
 * PUT /v0/submitTransfer/
 *
 * @param currencyId - The Concordium currency ID
 * @param data - The transfer payload (hex-encoded transaction body and signatures)
 * @returns Submission ID
 */
export async function submitTransfer(
  currencyId: string,
  data: SubmitTransferData,
): Promise<{ submissionId: string }> {
  return withClient(currencyId, async client => {
    const request: LiveNetworkRequest<SubmitTransferData> = {
      method: "PUT",
      url: "/v0/submitTransfer/",
      data,
    };
    return client.request<{ submissionId: string }, SubmitTransferData>(request);
  });
}

/**
 * Submit a credential deployment transaction to the network
 * PUT /v0/submitCredential/
 *
 * @param currencyId - The Concordium currency ID
 * @param data - The credential deployment data in proxy format
 * @returns Submission ID
 */
export async function submitCredential(
  currencyId: string,
  data: SubmitCredentialData,
): Promise<{ submissionId: string }> {
  return withClient(currencyId, async client => {
    const request: LiveNetworkRequest<SubmitCredentialData> = {
      method: "PUT",
      url: "/v0/submitCredential/",
      data: data,
    };

    return client.request<{ submissionId: string }, SubmitCredentialData>(request);
  });
}
