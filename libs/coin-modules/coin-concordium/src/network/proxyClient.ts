import BigNumber from "bignumber.js";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import network from "@ledgerhq/live-network";
import type { LiveNetworkRequest } from "@ledgerhq/live-network/network";
import { retry } from "@ledgerhq/live-promise";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { log } from "@ledgerhq/logs";
import { decodeMemoFromCbor } from "@ledgerhq/hw-app-concordium/lib/cbor";
import coinConfig from "../config";
import type {
  AccountBalanceResponse,
  TransactionsResponse,
  PublicKeyAccountsResponse,
  SubmitCredentialData,
  SubmitTransferRequest,
  TransactionQueryParams,
  WalletProxyTransaction,
} from "../types";

interface ProxyClient {
  baseUrl: string;
  request<TResponse, TRequest = unknown>(config: LiveNetworkRequest<TRequest>): Promise<TResponse>;
}

const PROXY_TIMEOUT = 30000;
const DEFAULT_RETRIES = 2;
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
 * @param retries - Number of retries (default: 2)
 * @returns Result of the execute function
 */
export async function withClient<T>(
  currency: CryptoCurrency,
  execute: (client: ProxyClient) => Promise<T>,
  retries = DEFAULT_RETRIES,
): Promise<T> {
  const client = getClient(currency);

  return retry(() => execute(client), {
    maxRetry: retries,
    interval: RETRY_DELAY,
    intervalMultiplicator: 1,
  });
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
): Promise<TransactionsResponse> {
  return withClient(currency, async client =>
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
  currency: CryptoCurrency,
  numSignatures: number,
  options?: { memoSize?: number },
): Promise<{ cost: string; energy: string }> {
  return withClient(currency, async client =>
    client.request<{ cost: string; energy: string }>({
      method: "GET",
      url: "/v0/transactionCost",
      params: {
        type: "simpleTransfer",
        numSignatures,
        ...(options?.memoSize ? { memoSize: options.memoSize } : {}),
      },
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
 * @returns Submission ID
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
 * @returns Submission ID
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
 * Raw operation data from wallet-proxy (network layer representation).
 * This type represents the raw transaction data without any framework abstractions.
 */
export interface ProxyOperation {
  id: string;
  hash: string;
  accountId: string;
  type: string;
  value: BigNumber;
  fee: BigNumber;
  blockHash: string | null;
  blockHeight: number;
  senders: string[];
  recipients: string[];
  date: Date;
  transactionSequenceNumber?: BigNumber;
  extra: Record<string, unknown>;
}

/**
 * Convert wallet-proxy transaction to network operation format
 */
function operationAdapter(
  tx: WalletProxyTransaction,
  accountAddress: string,
  accountId: string,
): ProxyOperation | null {
  if (tx.details.type !== "transfer" && tx.details.type !== "transferWithMemo") {
    return null;
  }

  const transferSource = tx.details.transferSource || "";
  const transferDestination = tx.details.transferDestination || "";

  const isOutgoing = transferSource === accountAddress;
  const isIncoming = transferDestination === accountAddress;

  // Ignore transactions that don't involve this account
  // (neither sender nor recipient matches the account address)
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
    extra.memo = decodeMemoFromCbor(Buffer.from(tx.details.memo, "hex"));
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
    extra,
  };
}

/**
 * Filters and converts wallet-proxy transactions to network operation format
 */
export async function getOperations(
  currency: CryptoCurrency,
  address: string,
  accountId: string,
  params?: { size?: number },
): Promise<ProxyOperation[]> {
  try {
    const proxyParams: TransactionQueryParams = {
      limit: params?.size || 100,
      order: "d",
    };

    const response = await getTransactions(currency, address, proxyParams);

    if (!("transactions" in response) || !Array.isArray(response.transactions)) {
      return [];
    }

    const operations = response.transactions
      .map(tx => operationAdapter(tx, address, accountId))
      .filter((op): op is ProxyOperation => op !== null);

    return operations;
  } catch (error) {
    log("concordium-proxy", `Error fetching transactions for ${address}`, { error });
    return [];
  }
}
