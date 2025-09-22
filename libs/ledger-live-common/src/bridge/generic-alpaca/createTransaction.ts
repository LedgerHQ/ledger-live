import { Account, TokenAccount } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { GenericTransaction } from "./types";

export function createTransaction(account: Account | TokenAccount): GenericTransaction {
  const currency =
    account.type === "TokenAccount" ? account.token.parentCurrency : account.currency;
  switch (currency.family) {
    case "xrp":
    case "ripple":
      return {
        family: currency.family,
        amount: BigNumber(0),
        recipient: "",
        fees: null,
        tag: undefined,
        feeCustomUnit: null, // NOTE: XRP does not use custom units for fees anymore
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
    case "evm": {
      return {
        mode: "send-eip1559",
        family: currency.family,
        amount: new BigNumber(0),
        recipient: "",
        useAllAmount: false,
        feesStrategy: "medium",
      };
    }
    case "hedera": {
      return {
        family: currency.family,
        amount: new BigNumber(0),
        recipient: "",
        mode: "send",
        useAllAmount: false,
      };
    }
    default:
      throw new Error(`Unsupported currency family: ${currency.family}`);
  }
}
