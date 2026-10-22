import { NetworkError } from "../../errors";
import {
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  getMinimumBalanceForRentExemptAccount,
} from "@solana/spl-token";
import {
  TransactionExpiredBlockheightExceededError,
  TransactionExpiredTimeoutError,
  ConfirmedSignatureInfo,
  Connection,
  FetchMiddleware,
  VersionedMessage,
  PublicKey,
  SignaturesForAddressOptions,
  StakeProgram,
  TransactionInstruction,
  ComputeBudgetProgram,
  VersionedTransaction,
  TransactionMessage,
  SendTransactionError,
  BlockhashWithExpiryBlockHeight,
  Commitment,
  GetLatestBlockhashConfig,
  SolanaJSONRPCError,
  SimulateTransactionConfig,
  RpcResponseAndContext,
  SimulatedTransactionResponse,
  SignatureResult,
  TransactionConfirmationStatus,
} from "@solana/web3.js";
import ky from "ky";
import { getTokenAccountProgramId } from "../../helpers/token";
import { paginatedProgramAccounts } from "./rpc/program-accounts";
import { Awaited } from "../../logic";
import { SolanaTokenProgram } from "../../types";
import {
  DEFAULT_BROADCAST_TIMEOUT_MS,
  DEFAULT_NODE_RETRIES,
  DEFAULT_NODE_RETRY_DELAY_MS,
} from "../../constants";

export const LATEST_BLOCKHASH_MOCK = "EEbZs6DmDyDjucyYbo3LwVJU7pQYuVopYcYTSEZXskW3";
export const LAST_VALID_BLOCK_HEIGHT_MOCK = 280064048;

export type Config = {
  readonly endpoint: string;
  readonly confirmationTimeoutMs?: number | undefined;
  readonly retries?: number | undefined;
  readonly retryDelayMs?: number | undefined;
};

export type ChainAPI = Readonly<{
  getBalance: (address: string) => Promise<number>;

  getLatestBlockhash: (
    commitmentOrConfig?: Commitment | GetLatestBlockhashConfig,
  ) => Promise<BlockhashWithExpiryBlockHeight>;

  getFeeForMessage: (message: VersionedMessage) => Promise<number | null>;

  getParsedTokenAccountsByOwner: (
    address: string,
  ) => ReturnType<Connection["getParsedTokenAccountsByOwner"]>;

  getParsedToken2022AccountsByOwner: (
    address: string,
  ) => ReturnType<Connection["getParsedTokenAccountsByOwner"]>;

  getStakeAccountsByWithdrawAuth: (
    authAddr: string,
  ) => ReturnType<Connection["getParsedProgramAccounts"]>;

  getInflationReward: (addresses: string[]) => ReturnType<Connection["getInflationReward"]>;

  getVoteAccounts: () => ReturnType<Connection["getVoteAccounts"]>;

  getSignaturesForAddress: (
    address: string,
    opts?: SignaturesForAddressOptions,
  ) => ReturnType<Connection["getSignaturesForAddress"]>;

  getSignaturesForAddressBatch: (
    requests: Array<{ address: string; opts?: SignaturesForAddressOptions }>,
  ) => Promise<ConfirmedSignatureInfo[][]>;

  getParsedTransactions: (signatures: string[]) => ReturnType<Connection["getParsedTransactions"]>;

  getAccountInfo: (
    address: string,
  ) => Promise<Awaited<ReturnType<Connection["getParsedAccountInfo"]>>["value"]>;

  getMultipleAccounts: (
    addresses: string[],
  ) => Promise<Awaited<ReturnType<Connection["getMultipleParsedAccounts"]>>["value"]>;

  sendRawTransaction: (
    buffer: Buffer,
    recentBlockhash?: BlockhashWithExpiryBlockHeight,
  ) => ReturnType<Connection["sendRawTransaction"]>;

  simulateTransaction: (
    transaction: VersionedTransaction,
    config?: SimulateTransactionConfig,
  ) => Promise<RpcResponseAndContext<SimulatedTransactionResponse>>;

  findAssocTokenAccAddress: (
    owner: string,
    mint: string,
    program: SolanaTokenProgram,
  ) => Promise<string>;

  getAssocTokenAccMinNativeBalance: () => Promise<number>;

  getMinimumBalanceForRentExemption: (dataLength: number) => Promise<number>;

  getStakeMinimumDelegation: () => Promise<number>;

  getEpochInfo: () => ReturnType<Connection["getEpochInfo"]>;

  getRecentPrioritizationFees: (
    accounts: string[],
  ) => ReturnType<Connection["getRecentPrioritizationFees"]>;

  getSimulationComputeUnits: (
    instructions: Array<TransactionInstruction>,
    payer: PublicKey,
  ) => Promise<number | null>;

  config: Config;
  connection: Connection;
}>;

// Naive mode, allow us to filter in sentry all this error coming from Sol RPC node
const remapErrors = (e: unknown) => {
  // An expired confirmation is an outcome, not a transport failure: flattening it would hide it
  // from `broadcast`, which turns it into `SolanaTxConfirmationTimeout`.
  if (
    e instanceof NetworkError ||
    e instanceof TransactionExpiredTimeoutError ||
    e instanceof TransactionExpiredBlockheightExceededError
  ) {
    throw e;
  }

  throw new NetworkError(e instanceof Error ? e.message : "Unknown Solana error");
};

// Same bar as the regular confirmation path: a "processed" transaction can still be dropped by a fork.
const LANDED_CONFIRMATION_STATUSES: ReadonlySet<TransactionConfirmationStatus> = new Set([
  "confirmed",
  "finalized",
]);

const hasLandedSuccessfully = async (connection: Connection, signature: string) => {
  try {
    const { value } = await connection.getSignatureStatus(signature, {
      searchTransactionHistory: true,
    });
    return (
      value !== null &&
      value.err === null &&
      value.confirmationStatus !== undefined &&
      LANDED_CONFIRMATION_STATUSES.has(value.confirmationStatus)
    );
  } catch {
    return false;
  }
};

type RetryPolicy = { retries: number; retryDelayMs: number };

// The proxy answers a rate limit with a JSON-RPC error over HTTP 200, so ky's status-based retry
// never sees it.
const RETRYABLE_MESSAGES = [
  "Failed to query long-term storage; please try again",
  "Upstream returned 429",
];

const remapErrorsWithRetry = <P extends Promise<T>, T>(
  callback: () => P,
  policy: RetryPolicy,
  attempt = 0,
) => {
  return (e: unknown): T | Promise<T> => {
    if (
      attempt < policy.retries &&
      e instanceof Error &&
      RETRYABLE_MESSAGES.some(m => e.message.includes(m))
    ) {
      const wait = policy.retryDelayMs * 2 ** attempt;
      return new Promise<void>(resolve => setTimeout(resolve, wait)).then(() =>
        callback().catch(remapErrorsWithRetry(callback, policy, attempt + 1)),
      );
    }
    return remapErrors(e);
  };
};

/*
NOTE: https://github.com/sindresorhus/ky?tab=readme-ov-file#retry
defaults values are set here https://github.com/sindresorhus/ky/blob/b49cd03d8673ea522a29bae4ef6b4672cf23201b/source/utils/normalize.ts#L14
*/
const kyNoTimeout = ky.create({
  timeout: false,
  retry: {
    limit: 3,
    statusCodes: [408, 413, 429, 500, 502, 503, 504],
    methods: ["get", "post", "put", "head", "delete", "options", "trace"],
  },
});

// https://github.com/anza-xyz/agave/blob/abfc33086c3eda73f89c0105e329a31c6b147ed0/rpc-client-api/src/custom_error.rs#L31
const JSON_RPC_SERVER_ERROR_FILTER_TRANSACTION_NOT_FOUND = -32020;

export function getChainAPI(
  config: Config,
  logger?: (url: string, options: any) => void,
): ChainAPI {
  const fetchMiddleware: FetchMiddleware | undefined =
    logger === undefined
      ? undefined
      : (url, options, fetch) => {
          logger(url.toString(), options);
          fetch(url, options);
        };

  const connection = new Connection(config.endpoint, {
    ...(fetchMiddleware ? { fetchMiddleware } : {}),
    fetch: kyNoTimeout as typeof fetch, // Type cast for jest test having an issue with the type
    commitment: "confirmed",
    confirmTransactionInitialTimeout: config.confirmationTimeoutMs ?? DEFAULT_BROADCAST_TIMEOUT_MS,
  });

  const retryPolicy: RetryPolicy = {
    retries: config.retries ?? DEFAULT_NODE_RETRIES,
    retryDelayMs: config.retryDelayMs ?? DEFAULT_NODE_RETRY_DELAY_MS,
  };

  const programAccounts = paginatedProgramAccounts(
    connection,
    config.endpoint,
    kyNoTimeout,
    logger,
  );

  return {
    getBalance: (address: string) =>
      connection.getBalance(new PublicKey(address)).catch(remapErrors),

    getLatestBlockhash: (commitmentOrConfig?: Commitment | GetLatestBlockhashConfig) =>
      connection.getLatestBlockhash(commitmentOrConfig).catch(remapErrors),

    getFeeForMessage: (msg: VersionedMessage) =>
      connection
        .getFeeForMessage(msg)
        .then(r => r.value)
        .catch(remapErrors),

    getParsedTokenAccountsByOwner: (address: string) => {
      const callback = () =>
        connection.getParsedTokenAccountsByOwner(new PublicKey(address), {
          programId: TOKEN_PROGRAM_ID,
        });
      return callback().catch(remapErrorsWithRetry(callback, retryPolicy));
    },

    getParsedToken2022AccountsByOwner: (address: string) => {
      const callback = () =>
        connection.getParsedTokenAccountsByOwner(new PublicKey(address), {
          programId: TOKEN_2022_PROGRAM_ID,
        });
      return callback().catch(remapErrorsWithRetry(callback, retryPolicy));
    },

    getStakeAccountsByWithdrawAuth: (authAddr: string) => {
      const callback = () =>
        programAccounts.getParsedProgramAccounts(StakeProgram.programId, {
          filters: [
            {
              memcmp: {
                offset: 44,
                bytes: authAddr,
              },
            },
          ],
        });
      return callback().catch(remapErrorsWithRetry(callback, retryPolicy));
    },

    getInflationReward: (addresses: string[]) =>
      connection.getInflationReward(addresses.map(addr => new PublicKey(addr))).catch(remapErrors),

    getVoteAccounts: () => connection.getVoteAccounts().catch(remapErrors),

    getSignaturesForAddress: (address: string, opts?: SignaturesForAddressOptions) => {
      const callback = () => {
        return connection.getSignaturesForAddress(new PublicKey(address), opts).catch(err => {
          if (
            err instanceof SolanaJSONRPCError &&
            err.code === JSON_RPC_SERVER_ERROR_FILTER_TRANSACTION_NOT_FOUND
          ) {
            return [];
          }
          throw err;
        });
      };
      return callback().catch(remapErrorsWithRetry(callback, retryPolicy));
    },

    getSignaturesForAddressBatch: (
      requests: Array<{ address: string; opts?: SignaturesForAddressOptions }>,
    ) => {
      if (requests.length === 0) return Promise.resolve([]);

      const callback = async (): Promise<ConfirmedSignatureInfo[][]> => {
        const body = requests.map(({ address, opts }, index) => ({
          jsonrpc: "2.0",
          id: String(index),
          method: "getSignaturesForAddress",
          params: [address, { ...opts, commitment: "confirmed" }],
        }));
        logger?.(config.endpoint, { method: "POST", body: JSON.stringify(body) });

        const response: unknown = await kyNoTimeout.post(config.endpoint, { json: body }).json();
        // Anything but an array is a batch-level failure, not a set of empty histories.
        if (!Array.isArray(response)) {
          throw new Error(
            `getSignaturesForAddress batch failed: ${JSON.stringify(response).slice(0, 200)}`,
          );
        }

        const byIndex: ConfirmedSignatureInfo[][] = requests.map(() => []);
        for (const entry of response) {
          if (!entry || typeof entry !== "object") continue;
          const { id, result, error } = entry as {
            id?: string;
            result?: ConfirmedSignatureInfo[];
            error?: unknown;
          };
          const index = Number(id);
          if (!Number.isInteger(index) || index < 0 || index >= requests.length) continue;
          if (error) {
            const code = (error as { code?: number }).code;
            if (code === JSON_RPC_SERVER_ERROR_FILTER_TRANSACTION_NOT_FOUND) continue;
            throw new Error(
              `getSignaturesForAddress failed for ${requests[index].address}: ${JSON.stringify(error).slice(0, 200)}`,
            );
          }
          if (Array.isArray(result)) byIndex[index] = result;
        }
        return byIndex;
      };
      return callback().catch(remapErrorsWithRetry(callback, retryPolicy));
    },

    getParsedTransactions: (signatures: string[]) =>
      connection
        .getParsedTransactions(signatures, {
          maxSupportedTransactionVersion: 1,
        })
        .catch(remapErrors),

    getAccountInfo: (address: string) =>
      connection
        .getParsedAccountInfo(new PublicKey(address))
        .then(r => r.value)
        .catch(remapErrors),

    getMultipleAccounts: (addresses: string[]) =>
      connection
        .getMultipleParsedAccounts(addresses.map(address => new PublicKey(address)))
        .then(r => r.value)
        .catch(remapErrors),

    simulateTransaction: (transaction: VersionedTransaction, config?: SimulateTransactionConfig) =>
      connection.simulateTransaction(transaction, config).catch(remapErrors),

    sendRawTransaction: (buffer: Buffer, recentBlockhash?: BlockhashWithExpiryBlockHeight) => {
      return (async () => {
        const commitment = "confirmed";

        let signature: string;
        try {
          signature = await connection.sendRawTransaction(buffer, {
            preflightCommitment: commitment,
          });
        } catch (error: unknown) {
          if (error instanceof SendTransactionError) {
            // web3.js types `signature` as private; it is '' for preflight rejections.
            const { signature } = error as unknown as { signature?: string };
            if (signature) {
              const logs = await error.getLogs(connection);
              throw new NetworkError(error.message, { logs });
            }
            throw new NetworkError(error.message, { logs: error.logs });
          }

          throw error;
        }

        if (!recentBlockhash) {
          recentBlockhash = await connection.getLatestBlockhash(commitment);
        }
        let status: SignatureResult;
        try {
          ({ value: status } = await connection.confirmTransaction(
            {
              blockhash: recentBlockhash.blockhash,
              lastValidBlockHeight: recentBlockhash.lastValidBlockHeight,
              signature,
            },
            commitment,
          ));
        } catch (error: unknown) {
          // confirmTransaction races a WebSocket subscription against a block-height poller: when
          // the subscription never fires, the poller throws even if the transaction landed.
          if (
            error instanceof TransactionExpiredBlockheightExceededError &&
            (await hasLandedSuccessfully(connection, signature))
          ) {
            return signature;
          }
          throw error;
        }
        if (status.err) {
          if (signature) {
            throw new SendTransactionError({
              action: "send",
              signature: signature,
              transactionMessage: `Status: (${JSON.stringify(status)})`,
            });
          }
          throw new Error(`Raw transaction ${signature} failed (${JSON.stringify(status)})`);
        }
        return signature;
      })().catch(remapErrors);
    },

    findAssocTokenAccAddress: (owner: string, mint: string, program: SolanaTokenProgram) => {
      return getAssociatedTokenAddress(
        new PublicKey(mint),
        new PublicKey(owner),
        undefined,
        getTokenAccountProgramId(program),
      )
        .then(r => r.toBase58())
        .catch(remapErrors);
    },

    getAssocTokenAccMinNativeBalance: () =>
      getMinimumBalanceForRentExemptAccount(connection).catch(remapErrors),

    getMinimumBalanceForRentExemption: (dataLength: number) =>
      connection.getMinimumBalanceForRentExemption(dataLength).catch(remapErrors),

    getStakeMinimumDelegation: () =>
      connection
        .getStakeMinimumDelegation()
        .then(res => res.value)
        .catch(remapErrors),

    getEpochInfo: () => connection.getEpochInfo().catch(remapErrors),

    getRecentPrioritizationFees: (accounts: string[]) => {
      return connection
        .getRecentPrioritizationFees({
          lockedWritableAccounts: accounts.map(acc => new PublicKey(acc)),
        })
        .catch(remapErrors);
    },

    getSimulationComputeUnits: async (instructions, payer) => {
      // https://solana.com/developers/guides/advanced/how-to-request-optimal-compute
      const testInstructions = [
        // Set an arbitrarily high number in simulation
        // so we can be sure the transaction will succeed
        // and get the real compute units used
        ComputeBudgetProgram.setComputeUnitLimit({ units: 1_400_000 }),
        ...instructions,
      ];
      const testTransaction = new VersionedTransaction(
        new TransactionMessage({
          instructions: testInstructions,
          payerKey: payer,
          // RecentBlockhash can by any public key during simulation
          // since 'replaceRecentBlockhash' is set to 'true' below
          recentBlockhash: PublicKey.default.toString(),
        }).compileToLegacyMessage(),
      );
      const rpcResponse = await connection.simulateTransaction(testTransaction, {
        replaceRecentBlockhash: true,
        sigVerify: false,
      });
      return rpcResponse.value.err ? null : rpcResponse.value.unitsConsumed || null;
    },

    config,
    connection,
  };
}
