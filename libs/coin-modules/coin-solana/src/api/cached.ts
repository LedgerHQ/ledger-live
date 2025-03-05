import { makeLRUCache, minutes, seconds } from "@ledgerhq/live-network/cache";
import { PublicKey, TransactionInstruction, TransactionMessage } from "@solana/web3.js";
import hash from "object-hash";
import { ChainAPI } from "./chain";

const cacheKeyAddress = (address: string) => address;
const cacheKeyEmpty = () => "" as const;
const cacheKeyAssocTokenAccAddress = (owner: string, mint: string) => `${owner}:${mint}`;
const cacheKeyMinimumBalanceForRentExemption = (dataLengt: number) => dataLengt.toString();

const cacheKeyTransactions = (signatures: string[]) => hash([...signatures].sort());
const cacheKeyInstructions = (ixs: TransactionInstruction[], payer: PublicKey) => {
  return hash(
    new TransactionMessage({
      instructions: ixs,
      payerKey: payer,
      recentBlockhash: payer.toString(),
    })
      .compileToLegacyMessage()
      .serialize(),
  );
};

const cacheKeyByArgs = (...args: any[]) => hash(args);

export function cached(api: ChainAPI): ChainAPI {
  return {
    findAssocTokenAccAddress: makeLRUCache(
      api.findAssocTokenAccAddress,
      cacheKeyAssocTokenAccAddress,
      minutes(1000),
    ),

    getAccountInfo: makeLRUCache(api.getAccountInfo, cacheKeyAddress, seconds(30)),

    getAssocTokenAccMinNativeBalance: makeLRUCache(
      api.getAssocTokenAccMinNativeBalance,
      cacheKeyEmpty,
      minutes(5),
    ),

    getBalance: makeLRUCache(api.getBalance, cacheKeyAddress, seconds(30)),

    getBalanceAndContext: makeLRUCache(api.getBalanceAndContext, cacheKeyAddress, seconds(30)),

    getParsedTransactions: makeLRUCache(
      api.getParsedTransactions,
      cacheKeyTransactions,
      seconds(30),
    ),

    getParsedTokenAccountsByOwner: makeLRUCache(
      api.getParsedTokenAccountsByOwner,
      cacheKeyAddress,
      minutes(1),
    ),

    getParsedToken2022AccountsByOwner: makeLRUCache(
      api.getParsedToken2022AccountsByOwner,
      cacheKeyAddress,
      minutes(1),
    ),

    // cached by default in api
    getStakeAccountsByStakeAuth: api.getStakeAccountsByStakeAuth,
    getStakeAccountsByWithdrawAuth: api.getStakeAccountsByWithdrawAuth,

    getStakeActivation: makeLRUCache(api.getStakeActivation, cacheKeyAddress, minutes(1)),

    getInflationReward: makeLRUCache(api.getInflationReward, cacheKeyByArgs, minutes(5)),

    getVoteAccounts: makeLRUCache(api.getVoteAccounts, cacheKeyEmpty, minutes(1)),

    getLatestBlockhash: makeLRUCache(api.getLatestBlockhash, cacheKeyEmpty, seconds(15)),

    getFeeForMessage: makeLRUCache(
      api.getFeeForMessage,
      msg => msg.serialize().toString(),
      minutes(1),
    ),

    getSignaturesForAddress: makeLRUCache(api.getSignaturesForAddress, cacheKeyByArgs, seconds(30)),

    getMinimumBalanceForRentExemption: makeLRUCache(
      api.getMinimumBalanceForRentExemption,
      cacheKeyMinimumBalanceForRentExemption,
      minutes(5),
    ),

    // do not cache
    sendRawTransaction: api.sendRawTransaction,

    getEpochInfo: makeLRUCache(api.getEpochInfo, cacheKeyEmpty, minutes(1)),

    getRecentPrioritizationFees: makeLRUCache(
      api.getRecentPrioritizationFees,
      cacheKeyByArgs,
      seconds(30),
    ),

    getSimulationComputeUnits: makeLRUCache(
      api.getSimulationComputeUnits,
      cacheKeyInstructions,
      seconds(30),
    ),

    config: api.config,
    connection: api.connection,
  };
}
