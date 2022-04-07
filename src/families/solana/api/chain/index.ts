import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  Token,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  Connection,
  FeeCalculator,
  FetchMiddleware,
  PublicKey,
  sendAndConfirmRawTransaction,
  SignaturesForAddressOptions,
  StakeProgram,
} from "@solana/web3.js";
import { Awaited } from "../../logic";

export type Config = {
  readonly endpoint: string;
};

export type ChainAPI = Readonly<{
  getBalance: (address: string) => Promise<number>;

  getRecentBlockhash: () => Promise<string>;

  getTxFeeCalculator: () => Promise<FeeCalculator>;

  getBalanceAndContext: (
    address: string
  ) => ReturnType<Connection["getBalanceAndContext"]>;

  getParsedTokenAccountsByOwner: (
    address: string
  ) => ReturnType<Connection["getParsedTokenAccountsByOwner"]>;

  getStakeAccountsByStakeAuth: (
    authAddr: string
  ) => ReturnType<Connection["getParsedProgramAccounts"]>;

  getStakeAccountsByWithdrawAuth: (
    authAddr: string
  ) => ReturnType<Connection["getParsedProgramAccounts"]>;

  getStakeActivation: (
    stakeAccAddr: string
  ) => ReturnType<Connection["getStakeActivation"]>;

  getInflationReward: (
    addresses: string[]
  ) => ReturnType<Connection["getInflationReward"]>;

  getVoteAccounts: () => ReturnType<Connection["getVoteAccounts"]>;

  getSignaturesForAddress: (
    address: string,
    opts?: SignaturesForAddressOptions
  ) => ReturnType<Connection["getSignaturesForAddress"]>;

  getParsedConfirmedTransactions: (
    signatures: string[]
  ) => ReturnType<Connection["getParsedConfirmedTransactions"]>;

  getAccountInfo: (
    address: string
  ) => Promise<
    Awaited<ReturnType<Connection["getParsedAccountInfo"]>>["value"]
  >;

  sendRawTransaction: (
    buffer: Buffer
  ) => ReturnType<Connection["sendRawTransaction"]>;

  findAssocTokenAccAddress: (owner: string, mint: string) => Promise<string>;

  getAssocTokenAccMinNativeBalance: () => Promise<number>;

  getMinimumBalanceForRentExemption: (dataLength: number) => Promise<number>;

  getEpochInfo: () => ReturnType<Connection["getEpochInfo"]>;

  config: Config;
}>;

export function getChainAPI(
  config: Config,
  logger?: (url: string, options: any) => void
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
    });
  };

  return {
    getBalance: (address: string) =>
      connection().getBalance(new PublicKey(address)),

    getRecentBlockhash: () =>
      connection()
        .getRecentBlockhash()
        .then((r) => r.blockhash),

    getTxFeeCalculator: () =>
      connection()
        .getRecentBlockhash()
        .then((r) => r.feeCalculator),

    getBalanceAndContext: (address: string) =>
      connection().getBalanceAndContext(new PublicKey(address)),

    getParsedTokenAccountsByOwner: (address: string) =>
      connection().getParsedTokenAccountsByOwner(new PublicKey(address), {
        programId: TOKEN_PROGRAM_ID,
      }),

    getStakeAccountsByStakeAuth: (authAddr: string) =>
      connection().getParsedProgramAccounts(StakeProgram.programId, {
        filters: [
          {
            memcmp: {
              offset: 12,
              bytes: authAddr,
            },
          },
        ],
      }),

    getStakeAccountsByWithdrawAuth: (authAddr: string) =>
      connection().getParsedProgramAccounts(StakeProgram.programId, {
        filters: [
          {
            memcmp: {
              offset: 44,
              bytes: authAddr,
            },
          },
        ],
      }),

    getStakeActivation: (stakeAccAddr: string) =>
      connection().getStakeActivation(new PublicKey(stakeAccAddr)),

    getInflationReward: (addresses: string[]) =>
      connection().getInflationReward(
        addresses.map((addr) => new PublicKey(addr))
      ),

    getVoteAccounts: () => connection().getVoteAccounts(),

    getSignaturesForAddress: (
      address: string,
      opts?: SignaturesForAddressOptions
    ) => connection().getSignaturesForAddress(new PublicKey(address), opts),

    getParsedConfirmedTransactions: (signatures: string[]) =>
      connection().getParsedConfirmedTransactions(signatures),

    getAccountInfo: (address: string) =>
      connection()
        .getParsedAccountInfo(new PublicKey(address))
        .then((r) => r.value),

    sendRawTransaction: (buffer: Buffer) => {
      return sendAndConfirmRawTransaction(connection(), buffer, {
        commitment: "confirmed",
      });
    },

    findAssocTokenAccAddress: (owner: string, mint: string) =>
      Token.getAssociatedTokenAddress(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        new PublicKey(mint),
        new PublicKey(owner)
      ).then((r) => r.toBase58()),

    getAssocTokenAccMinNativeBalance: () =>
      Token.getMinBalanceRentForExemptAccount(connection()),

    getMinimumBalanceForRentExemption: (dataLength: number) =>
      connection().getMinimumBalanceForRentExemption(dataLength),

    getEpochInfo: () => connection().getEpochInfo(),

    config,
  };
}
