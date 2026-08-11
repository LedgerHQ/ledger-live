import { Account, TokenAccount } from "@ledgerhq/types-live";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import BigNumber from "bignumber.js";
import { GenericTransaction } from "./types";

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
    case "tron":
      return {
        family: currency.family,
        amount: new BigNumber(0),
        recipient: "",
        fees: null,
        useAllAmount: false,
        mode: "send",
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
    default:
      throw new Error(`Unsupported currency family: ${currency.family}`);
  }
}
