import BigNumber from "bignumber.js";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/families/xrp/types";
import { xrpRlusdToken } from "./currency.mock";

export const optIn: Transaction = {
  family: "xrp",
  mode: "changeTrust",
  assetReference: xrpRlusdToken.tokenIdentifier,
  assetOwner: xrpRlusdToken.contractAddress,
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
