import { Account, TokenAccount } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
// ? LOGO Token
export type CompoundAssetMetric = {
  grossSupply: number;
  currentAPY: number;
};
export type CompoundNetworkInfo = {
  assets: CompoundAssetMetric[];
};
// implement data needed for a row of the UI
export type CompoundAccountStatus =
  | null
  | "ENABLING"
  | "INACTIVE"
  | "SUPPLYING"
  | "EARNING";
// NOTE: Not sure we need this
type LoanInternal = {
  amountSupplied: BigNumber;
  // in account.token unit
  interestsEarned: BigNumber;
  // in account.token unit
  startingDate: Date;
  percentageEarned: number;
};
export type OpenedLoan = LoanInternal;
export type ClosedLoan = LoanInternal & {
  endDate: Date;
};
export type ClosedLoanHistory = ClosedLoan & {
  account: TokenAccount;
  parentAccount: Account | null | undefined;
};
export type OpenedLoanHistory = OpenedLoan & {
  account: TokenAccount;
  parentAccount: Account | null | undefined;
};
export type ClosedLoansHistory = ClosedLoanHistory[];
export type OpenedLoansHistory = OpenedLoanHistory[];
export type Loan = OpenedLoan | ClosedLoan;
export type LoansLikeArray = OpenedLoan[] | ClosedLoan[];
export type CompoundAccountSummary = {
  opened: OpenedLoan[];
  closed: ClosedLoan[];
  account: TokenAccount;
  parentAccount: Account | null | undefined;
  totalSupplied: BigNumber;
  allTimeEarned: BigNumber;
  accruedInterests: BigNumber;
  status: CompoundAccountStatus;
};
