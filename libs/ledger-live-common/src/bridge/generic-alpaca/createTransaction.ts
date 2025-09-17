import { Account, TokenAccount, TransactionCommon } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import type { Unit } from "@ledgerhq/types-cryptoassets";

export enum NetworkCongestionLevel {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
}

export type NetworkInfo = {
  fees: BigNumber;
};

export function createTransaction(account: Account | TokenAccount): TransactionCommon & {
  family: string;
  fees?: BigNumber | null;
  tag?: number | null | undefined;
  feeCustomUnit?: Unit | null | undefined;
  memoType?: string | null;
  memoValue?: string | null;
  mode?: "send" | "changeTrust" | "send-legacy" | "send-eip1559";
  assetReference?: string;
  assetOwner?: string;
  networkInfo?: NetworkInfo | null;
} {
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
      };
    }
    default:
      throw new Error(`Unsupported currency family: ${currency.family}`);
  }
}
