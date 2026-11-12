import BigNumber from "bignumber.js";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/families/xrp/types";
import { XRP_TOKEN } from "./currency.mock";

export const optIn: Transaction = {
  family: "xrp",
  mode: "changeTrust",
  assetReference: XRP_TOKEN.tokenIdentifier,
  assetOwner: XRP_TOKEN.contractAddress,
  amount: new BigNumber(0),
  recipient: "",
  fees: null,
  networkInfo: null,
  tag: null,
};

export function makeStatus(errors: Record<string, Error> = {}): TransactionStatus {
  return {
    errors,
    warnings: {},
    estimatedFees: new BigNumber(0),
    amount: new BigNumber(0),
    totalSpent: new BigNumber(0),
  };
}
