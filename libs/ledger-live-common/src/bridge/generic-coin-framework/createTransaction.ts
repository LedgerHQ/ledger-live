import { Account, TokenAccount } from "@ledgerhq/types-live";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import BigNumber from "bignumber.js";
import { GenericTransaction } from "./types";

/** The plain-send defaults shared by families that add nothing of their own. */
function sendDefaults(family: string): GenericTransaction {
  return {
    family,
    amount: new BigNumber(0),
    recipient: "",
    fees: null,
    useAllAmount: false,
    mode: "send",
  };
}

export function createTransaction(account: Account | TokenAccount): GenericTransaction {
  const currency =
    account.type === "TokenAccount"
      ? getCryptoCurrencyById(account.token.parentCurrencyId)
      : account.currency;
  switch (currency.family) {
    case "xrp":
    case "ripple":
      return {
        family: currency.family,
        amount: BigNumber(0),
        recipient: "",
        fees: null,
        tag: undefined,
      };
    case "stellar":
      return {
        family: currency.family,
        amount: new BigNumber(0),
        fees: null,
        recipient: "",
        memoValue: null,
        memoType: null,
        useAllAmount: false,
        mode: "send",
        assetReference: "",
        assetOwner: "",
        networkInfo: null,
      };
    case "tezos":
      // note: default transaction for tezos, mode will be set by UI (send, stake, unstake)
      return {
        family: currency.family,
        amount: new BigNumber(0),
        fees: null,
        recipient: "",
        useAllAmount: false,
        mode: "send",
        networkInfo: null,
      };
    case "evm": {
      return {
        mode: "send",
        type: 2,
        family: currency.family,
        amount: new BigNumber(0),
        recipient: "",
        useAllAmount: false,
        feesStrategy: "medium",
        chainId: currency.ethereumLikeInfo?.chainId ?? 0,
        gasLimit: new BigNumber(21000),
        maxFeePerGas: new BigNumber(0),
        maxPriorityFeePerGas: new BigNumber(0),
      };
    }
    case "solana":
    // hypercore has no send flow; this is a neutral tx used only for (de)serialization.
    case "hypercore":
      return {
        family: currency.family,
        amount: new BigNumber(0),
        recipient: "",
        fees: null,
        mode: "send",
      };
    case "multiversx":
      return sendDefaults(currency.family);
    case "tron":
      return {
        ...sendDefaults(currency.family),
        // `duration: 3` is the Tron freeze period in days. The staking screens merge their patch over
        // this bag rather than replacing it, so a key they do not set keeps the value seeded here.
        familySpecificData: { resource: null, duration: 3, votes: [] },
      };
    case "near":
    case "vechain":
    case "cardano":
      // None has an account sequence: Cardano is UTXO, VeChain's nonce is a random uniqueness
      // field, and a NEAR nonce belongs to an access key rather than the account. getNextSequence
      // throws in all three modules, and utils.ts maps nonce → intent.sequence, which lets
      // signOperation skip that call. The value is inert for crafting — each module builds its
      // own — so the default tx is signable without callers having to set it.
      return {
        family: currency.family,
        amount: new BigNumber(0),
        recipient: "",
        fees: null,
        useAllAmount: false,
        mode: "send",
        nonce: new BigNumber(0),
      };
    case "cosmos":
      return {
        family: currency.family,
        mode: "send",
        amount: new BigNumber(0),
        recipient: "",
        fees: null,
        useAllAmount: false,
        memoType: null,
        memoValue: null,
        networkInfo: null,
      };
    case "kaspa":
      // UTXO chain — no account nonce/sequence, same as near/vechain/cardano above. Setting a
      // synthetic zero nonce here (inert for crafting — craftTransaction ignores it and builds
      // its own inputs from real UTXOs) makes transactionIntent.sequence a valid bigint, so
      // signOperation's guard skips calling getNextSequence entirely — which is then free to
      // throw like every other no-sequence family's, instead of needing a silent 0n stub.
      return {
        family: currency.family,
        amount: new BigNumber(0),
        recipient: "",
        fees: null,
        useAllAmount: false,
        mode: "send",
        feesStrategy: "fast",
        nonce: new BigNumber(0),
      };
    case "stacks":
      // Unlike near/vechain/cardano above, leaving nonce unset lets craftTransaction/estimateFees
      // fetch the real sequential nonce instead of defaulting to 0.
      return {
        family: currency.family,
        amount: new BigNumber(0),
        recipient: "",
        fees: null,
        useAllAmount: false,
        mode: "send",
        assetReference: "",
        assetOwner: "",
      };
    case "casper":
      // Same no-sequence pattern as near/vechain/cardano above; ttl is Casper's replay protection.
      return {
        ...sendDefaults(currency.family),
        memoType: null,
        memoValue: null,
        nonce: new BigNumber(0),
      };
    default:
      throw new Error(`Unsupported currency family: ${currency.family}`);
  }
}
