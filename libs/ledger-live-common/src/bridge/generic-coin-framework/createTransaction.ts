import { Account, TokenAccount } from "@ledgerhq/types-live";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
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
      return {
        family: currency.family,
        amount: new BigNumber(0),
        recipient: "",
        fees: null,
        mode: "send",
      };
    case "cardano":
      return {
        family: currency.family,
        amount: new BigNumber(0),
        recipient: "",
        fees: null,
        useAllAmount: false,
        mode: "send",
        // Cardano is UTXO — no account sequence. utils.ts maps nonce → intent.sequence, which lets
        // signOperation skip getNextSequence (coin-cardano throws it). nonce 0 is meaningless to
        // craft, so the default tx is signable without callers having to set it.
        nonce: new BigNumber(0),
      };
    default:
      throw new Error(`Unsupported currency family: ${currency.family}`);
  }
}
