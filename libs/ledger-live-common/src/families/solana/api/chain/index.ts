import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  getMinimumBalanceForRentExemptAccount,
} from "@solana/spl-token";
import {
  Connection,
  FetchMiddleware,
  VersionedMessage,
  PublicKey,
  sendAndConfirmRawTransaction,
  SignaturesForAddressOptions,
  StakeProgram,
} from "@solana/web3.js";
import { getEnv } from "@ledgerhq/live-env";
import { Awaited } from "../../logic";
import { NetworkDown } from "@ledgerhq/errors";

export type Config = {
  readonly endpoint: string;
};

export type ChainAPI = Readonly<{
  getBalance: (address: string) => Promise<number>;

  getLatestBlockhash: () => Promise<string>;

  getFeeForMessage: (message: VersionedMessage) => Promise<number | null>;

  getBalanceAndContext: (address: string) => ReturnType<Connection["getBalanceAndContext"]>;

  getParsedTokenAccountsByOwner: (
    address: string,
  ) => ReturnType<Connection["getParsedTokenAccountsByOwner"]>;

  getStakeAccountsByStakeAuth: (
    authAddr: string,
  ) => ReturnType<Connection["getParsedProgramAccounts"]>;

  getStakeAccountsByWithdrawAuth: (
    authAddr: string,
  ) => ReturnType<Connection["getParsedProgramAccounts"]>;

  getStakeActivation: (stakeAccAddr: string) => ReturnType<Connection["getStakeActivation"]>;

  getInflationReward: (addresses: string[]) => ReturnType<Connection["getInflationReward"]>;

  getVoteAccounts: () => ReturnType<Connection["getVoteAccounts"]>;

  getSignaturesForAddress: (
    address: string,
    opts?: SignaturesForAddressOptions,
  ) => ReturnType<Connection["getSignaturesForAddress"]>;

  getParsedTransactions: (signatures: string[]) => ReturnType<Connection["getParsedTransactions"]>;

  getAccountInfo: (
    address: string,
  ) => Promise<Awaited<ReturnType<Connection["getParsedAccountInfo"]>>["value"]>;

  sendRawTransaction: (buffer: Buffer) => ReturnType<Connection["sendRawTransaction"]>;

  findAssocTokenAccAddress: (owner: string, mint: string) => Promise<string>;

  getAssocTokenAccMinNativeBalance: () => Promise<number>;

  getMinimumBalanceForRentExemption: (dataLength: number) => Promise<number>;

  getEpochInfo: () => ReturnType<Connection["getEpochInfo"]>;

  config: Config;
}>;

// Naive mode, allow us to filter in sentry all this error comming from Sol RPC node
const remapErrors = e => {
  throw new NetworkDown(e?.message);
};

export function getChainAPI(
  config: Config,
  logger?: (url: string, options: any) => void,
): ChainAPI {
  const fetchMiddleware: FetchMiddleware | undefined =
    logger === undefined
      ? undefined
      : (url, options, fetch) => {
          logger(url, options);
          fetch(url, options);
        };

  const connection = () => {
    return new Connection(config.endpoint, {
      commitment: "finalized",
      fetchMiddleware,
      confirmTransactionInitialTimeout: getEnv("SOLANA_TX_CONFIRMATION_TIMEOUT"),
    });
  };

  return {
    getBalance: (address: string) =>
      connection().getBalance(new PublicKey(address)).catch(remapErrors),

    getLatestBlockhash: () =>
      connection()
        .getLatestBlockhash()
        .then(r => r.blockhash)
        .catch(remapErrors),

    getFeeForMessage: (msg: VersionedMessage) =>
      connection()
        .getFeeForMessage(msg)
        .then(r => r.value)
        .catch(remapErrors),

    getBalanceAndContext: (address: string) =>
      connection().getBalanceAndContext(new PublicKey(address)).catch(remapErrors),

    getParsedTokenAccountsByOwner: (address: string) =>
      connection()
        .getParsedTokenAccountsByOwner(new PublicKey(address), {
          programId: TOKEN_PROGRAM_ID,
        })
        .catch(remapErrors),

    getStakeAccountsByStakeAuth: (authAddr: string) =>
      connection()
        .getParsedProgramAccounts(StakeProgram.programId, {
          filters: [
            {
              memcmp: {
                offset: 12,
                bytes: authAddr,
              },
            },
          ],
        })
        .catch(remapErrors),

    getStakeAccountsByWithdrawAuth: (authAddr: string) =>
      connection()
        .getParsedProgramAccounts(StakeProgram.programId, {
          filters: [
            {
              memcmp: {
                offset: 44,
                bytes: authAddr,
              },
            },
          ],
        })
        .catch(remapErrors),

    getStakeActivation: (stakeAccAddr: string) =>
      connection().getStakeActivation(new PublicKey(stakeAccAddr)).catch(remapErrors),

    getInflationReward: (addresses: string[]) =>
      connection()
        .getInflationReward(addresses.map(addr => new PublicKey(addr)))
        .catch(remapErrors),

    getVoteAccounts: () => connection().getVoteAccounts().catch(remapErrors),

    getSignaturesForAddress: (address: string, opts?: SignaturesForAddressOptions) =>
      connection().getSignaturesForAddress(new PublicKey(address), opts).catch(remapErrors),

    getParsedTransactions: (signatures: string[]) =>
      connection()
        .getParsedTransactions(signatures, {
          maxSupportedTransactionVersion: 0,
        })
        .catch(remapErrors),

    getAccountInfo: (address: string) =>
      connection()
        .getParsedAccountInfo(new PublicKey(address))
        .then(r => r.value)
        .catch(remapErrors),

    sendRawTransaction: (buffer: Buffer) => {
      return sendAndConfirmRawTransaction(connection(), buffer, {
        commitment: "confirmed",
      }).catch(remapErrors);
    },

    findAssocTokenAccAddress: (owner: string, mint: string) => {
      return getAssociatedTokenAddress(new PublicKey(mint), new PublicKey(owner))
        .then(r => r.toBase58())
        .catch(remapErrors);
    },

    getAssocTokenAccMinNativeBalance: () =>
      getMinimumBalanceForRentExemptAccount(connection()).catch(remapErrors),

    getMinimumBalanceForRentExemption: (dataLength: number) =>
      connection().getMinimumBalanceForRentExemption(dataLength).catch(remapErrors),

    getEpochInfo: () => connection().getEpochInfo().catch(remapErrors),

    config,
  };
}
