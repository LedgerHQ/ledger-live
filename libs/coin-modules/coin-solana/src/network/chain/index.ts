import { NetworkError } from "../../errors";
import { getEnv } from "@ledgerhq/live-env";
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
} from "@solana/web3.js";
import ky from "ky";
import { getTokenAccountProgramId } from "../../helpers/token";
import { paginatedProgramAccounts } from "./rpc/program-accounts";
import { Awaited } from "../../logic";
import { SolanaTokenProgram } from "../../types";

export const LATEST_BLOCKHASH_MOCK = "EEbZs6DmDyDjucyYbo3LwVJU7pQYuVopYcYTSEZXskW3";
export const LAST_VALID_BLOCK_HEIGHT_MOCK = 280064048;

export type Config = {
  readonly endpoint: string;
};

export type ChainAPI = Readonly<{
  getBalance: (address: string) => Promise<number>;

  getLatestBlockhash: (
    commitmentOrConfig?: Commitment | GetLatestBlockhashConfig,
  ) => Promise<BlockhashWithExpiryBlockHeight>;

  getFeeForMessage: (message: VersionedMessage) => Promise<number | null>;

  getBalanceAndContext: (address: string) => ReturnType<Connection["getBalanceAndContext"]>;

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

  /** Every address in one JSON-RPC batch, so hundreds of token accounts cost one request. */
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

const remapErrorsWithRetry = <P extends Promise<T>, T>(callback: () => P, times = 3) => {
  return (e: unknown): T | Promise<T> => {
    if (
      times > 0 &&
      e instanceof Error &&
      e.message.includes("Failed to query long-term storage; please try again")
    ) {
      return callback().catch(remapErrorsWithRetry(callback, times - 1));
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
    confirmTransactionInitialTimeout: getEnv("SOLANA_TX_CONFIRMATION_TIMEOUT") || 0,
  });

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

    getBalanceAndContext: (address: string) =>
      connection.getBalanceAndContext(new PublicKey(address)).catch(remapErrors),

    getParsedTokenAccountsByOwner: (address: string) =>
      connection
        .getParsedTokenAccountsByOwner(new PublicKey(address), {
          programId: TOKEN_PROGRAM_ID,
        })
        .catch(remapErrors),

    getParsedToken2022AccountsByOwner: (address: string) =>
      connection
        .getParsedTokenAccountsByOwner(new PublicKey(address), {
          programId: TOKEN_2022_PROGRAM_ID,
        })
        .catch(remapErrors),

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
      return callback().catch(remapErrorsWithRetry(callback));
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
      return callback().catch(remapErrorsWithRetry(callback));
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
          params: [address, { commitment: "confirmed", ...opts }],
        }));
        const response: unknown = await kyNoTimeout.post(config.endpoint, { json: body }).json();
        const byIndex: ConfirmedSignatureInfo[][] = requests.map(() => []);
        if (Array.isArray(response)) {
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
              // An empty stream would drop the source from the cursor and lose its older history.
              const code = (error as { code?: number }).code;
              if (code === JSON_RPC_SERVER_ERROR_FILTER_TRANSACTION_NOT_FOUND) continue;
              throw new Error(
                `getSignaturesForAddress failed for ${requests[index].address}: ${JSON.stringify(error)}`,
              );
            }
            if (Array.isArray(result)) byIndex[index] = result;
          }
        }
        return byIndex;
      };
      return callback().catch(remapErrorsWithRetry(callback));
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
            const logs = await error.getLogs(connection);
            throw new NetworkError(error.message, { logs });
          }

          throw error;
        }

        if (!recentBlockhash) {
          recentBlockhash = await connection.getLatestBlockhash(commitment);
        }
        const { value: status } = await connection.confirmTransaction(
          {
            blockhash: recentBlockhash.blockhash,
            lastValidBlockHeight: recentBlockhash.lastValidBlockHeight,
            signature,
          },
          commitment,
        );
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
