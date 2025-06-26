import { Account, TokenAccount, TransactionCommon } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import type { Unit } from "@ledgerhq/types-cryptoassets";

export enum NetworkCongestionLevel {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
}

export type NetworkInfo = {
  family: "xrp" | "stellar";
  serverFee: BigNumber;
  baseReserve: BigNumber;
  fees: BigNumber;
  baseFee: BigNumber;
  networkCongestionLevel?: NetworkCongestionLevel | undefined;
};

// export function createTransaction(account: Account): TransactionCommon & {
//   family: string;
//   fee: BigNumber | null | undefined;
//   networkInfo: NetworkInfo | null | undefined;
//   tag: number | null | undefined;
//   feeCustomUnit: Unit | null | undefined;
// } {
//   return {
//     family: account.currency.family,
//     amount: BigNumber(0),
//     recipient: "",
//     fee: null,
//     tag: undefined,
//     networkInfo: null,
//     feeCustomUnit: null,
//   };
// }

export function createTransaction(account: Account | TokenAccount): TransactionCommon & {
  family: string;
  fee?: BigNumber | null | undefined;
  fees?: BigNumber | null;
  networkInfo: NetworkInfo | null | undefined;
  tag: number | null | undefined;
  feeCustomUnit: Unit | null | undefined;
  baseReserve?: BigNumber | null;
  memoType?: string | null;
  memoValue?: string | null;
  mode?: "send" | "changeTrust";
  assetCode?: string;
  assetIssuer?: string;
} {
  const currency =
    account.type === "TokenAccount" ? account.token.parentCurrency : account.currency;
  // if (account.type === "TokenAccount") {
  //   debugger;
  // }
  switch (currency.family) {
    case "xrp":
      return {
        family: currency.family,
        amount: BigNumber(0),
        recipient: "",
        fee: null,
        tag: undefined,
        networkInfo: null,
        feeCustomUnit: null, // NOTE: XRP does not use custom units for fees anymore
      };
    case "stellar":
      return {
        family: currency.family,
        amount: new BigNumber(0),
        baseReserve: null,
        networkInfo: null,
        fees: null,
        recipient: "",
        memoValue: null,
        memoType: null,
        useAllAmount: false,
        mode: "send",
        assetCode: "",
        assetIssuer: "",
        tag: undefined,
        feeCustomUnit: null,
      };
    default:
      throw new Error(`Unsupported currency family: ${currency.family}`);
  }
}
