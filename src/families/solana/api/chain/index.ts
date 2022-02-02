import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  Token,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  Connection,
  FeeCalculator,
  PublicKey,
  sendAndConfirmRawTransaction,
  SignaturesForAddressOptions,
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

  config: Config;
}>;

export function getChainAPI(config: Config): ChainAPI {
  const connection = () => new Connection(config.endpoint, "finalized");

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

    config,
  };
}
