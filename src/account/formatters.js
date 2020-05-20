// @flow

import invariant from "invariant";
import { BigNumber } from "bignumber.js";
import {
  toAccountRaw,
  getAccountCurrency,
  getAccountName,
  getAccountUnit,
} from ".";
import type { Account, Operation, Unit } from "../types";
import { getOperationAmountNumberWithInternals } from "../operation";
import { formatCurrencyUnit } from "../currencies";
import { getOperationAmountNumber } from "../operation";

const isSignificantAccount = (acc) =>
  acc.balance.gt(10 ** (getAccountUnit(acc).magnitude - 6));

const formatOp = (unitByAccountId: (string) => ?Unit) => {
  const format = (op: Operation, level = 0) => {
    const unit = unitByAccountId(op.accountId);
    const amountBN = getOperationAmountNumber(op);
    const amount = unit
      ? formatCurrencyUnit(unit, amountBN, {
          showCode: true,
          alwaysShowSign: true,
        })
      : "? " + amountBN.toString();
    const spaces = Array((level + 1) * 2)
      .fill(" ")
      .join("");
    const extra = level > 0 ? "" : `${op.hash}     ${op.date.toISOString()}`;
    const head = `${(spaces + amount).padEnd(20)} ${op.type.padEnd(
      11
    )}${extra}`;
    const sub = (op.subOperations || [])
      .concat(op.internalOperations || [])
      .map((subop) => format(subop, level + 1))
      .join("");
    return `\n${head}${sub}`;
  };
  return (op: Operation) => format(op, 0);
};

function maybeDisplaySumOfOpsIssue(ops, balance, unit) {
  const sumOfOps = ops.reduce(
    (sum, op) => sum.plus(getOperationAmountNumber(op)),
    BigNumber(0)
  );
  if (sumOfOps.eq(balance)) return "";
  return (
    " (! sum of ops is different: " +
    formatCurrencyUnit(unit, sumOfOps, {
      showCode: true,
      disableRounding: true,
    }) +
    ")"
  );
}

const cliFormat = (account, summaryOnly) => {
  const {
    name,
    freshAddress,
    freshAddressPath,
    derivationMode,
    index,
    xpub,
    operations,
  } = account;

  const balance = formatCurrencyUnit(account.unit, account.balance, {
    showCode: true,
  });

  const opsCount = `${operations.length} operations`;
  const freshInfo = `${freshAddress} on ${freshAddressPath}`;
  const derivationInfo = `${derivationMode}#${index}`;
  const head = `${name}: ${balance} (${opsCount}) (${freshInfo}) (${derivationInfo} ${
    xpub || ""
  })${maybeDisplaySumOfOpsIssue(
    operations,
    account.balance,
    getAccountUnit(account)
  )}`;

  const subAccounts = account.subAccounts || [];
  const ops = operations
    .map(
      formatOp((id) => {
        if (account.id === id) return account.unit;
        const ta = subAccounts.find((a) => a.id === id);
        if (ta) return getAccountUnit(ta);
        throw new Error("unexpected missing token account");
      })
    )
    .join("");

  const tokens = subAccounts
    .map(
      (ta) =>
        "\n  " +
        ta.type +
        " " +
        getAccountName(ta) +
        ": " +
        formatCurrencyUnit(getAccountUnit(ta), ta.balance, {
          showCode: true,
          disableRounding: true,
        }) +
        " (" +
        ta.operations.length +
        " ops)" +
        maybeDisplaySumOfOpsIssue(ta.operations, ta.balance, getAccountUnit(ta))
    )
    .join("");

  return head + tokens + (summaryOnly ? "" : ops);
};

const stats = (account) => {
  const { subAccounts, operations } = account;

  const sumOfAllOpsNumber = operations.reduce(
    (sum: BigNumber, op) => sum.plus(getOperationAmountNumberWithInternals(op)),
    BigNumber(0)
  );

  const sumOfAllOps = formatCurrencyUnit(account.unit, sumOfAllOpsNumber, {
    showCode: true,
  });

  const balance = formatCurrencyUnit(account.unit, account.balance, {
    showCode: true,
  });

  return {
    balance,
    sumOfAllOps,
    opsCount: operations.length,
    subAccountsCount: (subAccounts || []).length,
  };
};

export const accountFormatters: { [_: string]: (Account) => any } = {
  json: (account) => JSON.stringify(toAccountRaw(account)),
  default: (account) => cliFormat(account),
  summary: (account) => cliFormat(account, true),
  stats: (account) => stats(account),
  significantTokenTickers: (account) =>
    (account.subAccounts || [])
      .filter(isSignificantAccount)
      .map((ta) => getAccountCurrency(ta).ticker)
      .join("\n"),
};

export function formatAccount(
  account: Account,
  format: string = "default"
): string {
  const f = accountFormatters[format];
  invariant(f, "missing account formatter=" + format);
  return f(account);
}

export function formatOperation(account: ?Account): (Operation) => string {
  const unitByAccountId = (id: string) => {
    if (!account) return;
    if (account.id === id) return account.unit;
    const ta = (account.subAccounts || []).find((a) => a.id === id);
    if (ta) return getAccountUnit(ta);
  };
  return formatOp(unitByAccountId);
}
