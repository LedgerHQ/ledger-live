import BigNumber from "bignumber.js";
import type { Operation } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/families/xrp/types";
import { XRP_ACCOUNT } from "./account.mock";
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

export const xrpOperation = { id: "op-1", accountId: XRP_ACCOUNT.id } as Operation;

export const reserveRelease = Object.assign(new Error(), {
  name: "XrpReserveRelease",
  amount: "0.2 XRP",
});

export function makeStatus(
  errors: Record<string, Error> = {},
  warnings: Record<string, Error> = {},
): TransactionStatus {
  return {
    errors,
    warnings,
    estimatedFees: new BigNumber(0),
    amount: new BigNumber(0),
    totalSpent: new BigNumber(0),
  };
}
