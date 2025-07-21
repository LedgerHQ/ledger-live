import { Account, TransactionCommon } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import type { Unit } from "@ledgerhq/types-cryptoassets";

export type NetworkInfo = {
  family: "xrp";
  serverFee: BigNumber;
  baseReserve: BigNumber;
};

export function createTransaction(account: Account): TransactionCommon & {
  family: string;
  fee: BigNumber | null | undefined;
  networkInfo: NetworkInfo | null | undefined;
  tag: number | null | undefined;
  feeCustomUnit: Unit | null | undefined;
} {
  return {
    family: account.currency.family,
    amount: BigNumber(0),
    recipient: "",
    fee: null,
    tag: undefined,
    networkInfo: null,
    feeCustomUnit: null,
  };
}
