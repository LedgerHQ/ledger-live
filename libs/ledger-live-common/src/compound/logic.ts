import { BigNumber } from "bignumber.js";
import { findCompoundToken } from "../currencies";
import type {
  CompoundAccountSummary,
  ClosedLoansHistory,
  OpenedLoansHistory,
  OpenedLoan,
  ClosedLoan,
  CompoundAccountStatus,
} from "./types";
import {
  findCurrentRate,
  getEnabledAmount,
} from "../families/ethereum/modules/compound";
import { Account, Operation, TokenAccount } from "@ledgerhq/types-live";
// to confirm in practice if this threshold is high enough / too high
const unlimitedThreshold = new BigNumber(2).pow(250);
export function getAccountCapabilities(account: TokenAccount):
  | {
      enabledAmount: BigNumber;
      enabledAmountIsUnlimited: boolean;
      canSupply: boolean;
      canSupplyMax: boolean;
      canWithdraw: boolean;
      status: CompoundAccountStatus;
    }
  | null
  | undefined {
  if (account.balance.eq(0)) return;
  const { token } = account;
  const ctoken = findCompoundToken(token);

  if (!ctoken) {
    return {
      enabledAmount: new BigNumber(0),
      enabledAmountIsUnlimited: false,
      canSupply: false,
      canSupplyMax: false,
      canWithdraw: false,
      status: null,
    };
  }

  const enabledAmount = getEnabledAmount(account);
  const enabledAmountIsUnlimited = enabledAmount.gt(unlimitedThreshold);
  // TODO: we might want to keep things to false if there are pending actions
  const canSupply = enabledAmount.gt(0) && account.spendableBalance.gt(0);
  const canSupplyMax = canSupply && account.spendableBalance.lte(enabledAmount);
  const cdaiBalanceInDai = account.balance.minus(account.spendableBalance);
  const canWithdraw = cdaiBalanceInDai.gt(0);
  const notEnabled = enabledAmount.eq(0);
  const pendingOps = account.pendingOperations.filter(
    (op) => !account.operations.some((o) => o.hash === op.hash)
  );
  const enabling = pendingOps.some((op) => op.extra?.approving);
  const supplying = pendingOps.some((op) => op.type === "SUPPLY");
  let status;

  if (canWithdraw) {
    status = "EARNING";
  } else if (notEnabled) {
    if (enabling) {
      status = "ENABLING";
    } else {
      status = null;
    }
  } else if (supplying) {
    status = "SUPPLYING";
  } else {
    status = "INACTIVE";
  }

  return {
    enabledAmount,
    enabledAmountIsUnlimited,
    // can supply at least the full amount of the balance
    canSupplyMax,
    // can supply anything at all
    canSupply,
    // can withdraw anything at all
    canWithdraw,
    status,
  };
}
export const getEnablingOp = (
  account: TokenAccount
): Operation | null | undefined =>
  account.pendingOperations.find((op) => op.extra?.approving);

const calcInterests = (
  value: BigNumber,
  openRate: BigNumber,
  closeOrCurrentRate: BigNumber
): BigNumber => value.times(closeOrCurrentRate).minus(value.times(openRate));

export function makeCompoundSummaryForAccount(
  account: TokenAccount,
  parentAccount: Account | null | undefined
): CompoundAccountSummary | null | undefined {
  const capabilities = getAccountCapabilities(account);
  if (!capabilities) return;
  const { status } = capabilities;
  if (!status) return;
  const { operations } = account;
  const opened: Array<{
    startingDate: Date;
    amountSupplied: BigNumber;
    openRate: BigNumber;
    compoundValue: BigNumber;
  }> = [];
  const closed: Array<{
    startingDate: Date;
    endDate: Date;
    amountSupplied: BigNumber;
    openRate: BigNumber;
    compoundValue: BigNumber;
    closeRate: BigNumber;
  }> = [];
  let totalSupplied = new BigNumber(0);
  let allTimeEarned = new BigNumber(0);
  let accruedInterests = new BigNumber(0);
  const currentRate = findCurrentRate(account.token);

  if (!currentRate) {
    return {
      opened: [],
      closed: [],
      account,
      parentAccount,
      totalSupplied,
      allTimeEarned,
      accruedInterests,
      status,
    };
  }

  operations
    .slice(0)
    .reverse()
    .filter((op) => !op.hasFailed)
    .forEach((operation) => {
      if (operation.type === "SUPPLY") {
        opened.push({
          startingDate: operation.date,
          amountSupplied: operation.value,
          openRate: new BigNumber(operation.extra.rate),
          compoundValue: new BigNumber(operation.extra.compoundValue),
        });
      }

      if (operation.type === "REDEEM") {
        let amountToClose = operation.value;

        while (amountToClose.gt(0) && opened.length > 0) {
          const closingOperation = opened.shift();

          // NOTE: Potentially not dangerous as we do check that
          // opened.length > 0 so unshift should never be undefined
          if (!closingOperation) return;

          if (amountToClose.gte(closingOperation.amountSupplied)) {
            closed.push({
              amountSupplied: closingOperation.amountSupplied,
              openRate: closingOperation.openRate,
              closeRate: new BigNumber(operation.extra.rate),
              endDate: operation.date,
              startingDate: closingOperation.startingDate,
              compoundValue: new BigNumber(operation.extra.compoundValue),
            });
          } else {
            closed.push({
              amountSupplied: amountToClose,
              openRate: closingOperation.openRate,
              closeRate: new BigNumber(operation.extra.rate),
              endDate: operation.date,
              startingDate: closingOperation.startingDate,
              compoundValue: new BigNumber(operation.extra.compoundValue),
            });
            opened.unshift({
              amountSupplied:
                closingOperation.amountSupplied.minus(amountToClose),
              openRate: closingOperation.openRate,
              startingDate: closingOperation.startingDate,
              compoundValue: closingOperation.compoundValue.minus(
                new BigNumber(operation.extra.compoundValue)
              ),
            });
          }

          amountToClose = amountToClose.minus(closingOperation.amountSupplied);
        }
      }
    });
  const o: OpenedLoan[] = opened.map((op) => {
    const { compoundValue, openRate, amountSupplied, startingDate } = op;
    const interestsEarned = calcInterests(
      compoundValue,
      openRate,
      currentRate.rate
    );
    const percentageEarned = interestsEarned.div(amountSupplied).times(100);
    totalSupplied = totalSupplied.plus(amountSupplied);
    accruedInterests = accruedInterests.plus(interestsEarned);
    allTimeEarned = allTimeEarned.plus(interestsEarned);
    return {
      startingDate,
      amountSupplied,
      interestsEarned,
      percentageEarned: percentageEarned.toNumber(),
    };
  });
  const c: ClosedLoan[] = closed.map((op) => {
    const {
      compoundValue,
      openRate,
      amountSupplied,
      startingDate,
      endDate,
      closeRate,
    } = op;
    const interestsEarned = calcInterests(compoundValue, openRate, closeRate);
    const percentageEarned = interestsEarned.div(amountSupplied).times(100);
    allTimeEarned = allTimeEarned.plus(interestsEarned);
    return {
      startingDate,
      endDate,
      amountSupplied,
      interestsEarned,
      percentageEarned: percentageEarned.toNumber(),
    };
  });
  return {
    account,
    parentAccount,
    opened: o,
    closed: c,
    totalSupplied,
    allTimeEarned,
    accruedInterests,
    status,
  };
}
export const makeClosedHistoryForAccounts = (
  summaries: CompoundAccountSummary[]
): ClosedLoansHistory =>
  summaries
    .reduce((loans, summary) => {
      if (!summary.closed.length) return loans;
      return loans.concat(
        summary.closed.map((c) => ({
          ...c,
          account: summary.account,
          parentAccount: summary.parentAccount,
        }))
      );
    }, [] as ClosedLoansHistory)
    .sort((a, b) => {
      return b.endDate.getTime() - a.endDate.getTime();
    });
export const makeOpenedHistoryForAccounts = (
  summaries: CompoundAccountSummary[]
): OpenedLoansHistory =>
  summaries
    .reduce((loans, summary) => {
      if (!summary.opened.length) return loans;
      return loans.concat(
        // $FlowFixMe issue on LLD side
        summary.opened.map((c) => ({
          ...c,
          account: summary.account,
          parentAccount: summary.parentAccount,
        }))
      );
    }, [] as OpenedLoansHistory)
    .sort((a, b) => {
      return b.startingDate.getTime() - a.startingDate.getTime();
    });
