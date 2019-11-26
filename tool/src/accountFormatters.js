// @flow

import { BigNumber } from "bignumber.js";
import {
  toAccountRaw,
  getAccountCurrency,
  getAccountName,
  getAccountUnit
} from "@ledgerhq/live-common/lib/account";
import type { Account } from "@ledgerhq/live-common/lib/types";
import { getOperationAmountNumberWithInternals } from "@ledgerhq/live-common/lib/operation";
import { formatCurrencyUnit } from "@ledgerhq/live-common/lib/currencies";
import { getOperationAmountNumber } from "@ledgerhq/live-common/lib/operation";

// TODO move to live common
const isSignificantAccount = acc =>
  acc.balance.gt(10 ** (getAccountUnit(acc).magnitude - 6));

const formatOp = unitByAccountId => {
  const format = (op, level = 0) => {
    const amount = formatCurrencyUnit(
      unitByAccountId(op.accountId),
      getOperationAmountNumber(op),
      {
        showCode: true,
        alwaysShowSign: true
      }
    );
    const spaces = Array((level + 1) * 2)
      .fill(" ")
      .join("");
    const extra = level > 0 ? "" : `${op.hash}     ${op.date.toISOString()}`;
    const head = `${(spaces + amount).padEnd(20)} ${op.type.padEnd(
      11
    )}${extra}`;
    const sub = (op.subOperations || [])
      .concat(op.internalOperations || [])
      .map(subop => format(subop, level + 1))
      .join("");
    return `\n${head}${sub}`;
  };
  return op => format(op, 0);
};

const cliFormat = (account, summaryOnly) => {
  const {
    name,
    freshAddress,
    freshAddressPath,
    derivationMode,
    index,
    xpub,
    operations
  } = account;

  const balance = formatCurrencyUnit(account.unit, account.balance, {
    showCode: true
  });

  const opsCount = `${operations.length} operations`;
  const freshInfo = `${freshAddress} on ${freshAddressPath}`;
  const derivationInfo = `${derivationMode}#${index}`;
  const head = `${name}: ${balance} (${opsCount}) (${freshInfo}) (${derivationInfo} ${xpub ||
    ""})`;

  const subAccounts = account.subAccounts || [];
  const ops = operations
    .map(
      formatOp(id => {
        if (account.id === id) return account.unit;
        const ta = subAccounts.find(a => a.id === id);
        if (ta) return getAccountUnit(ta);
        throw new Error("unexpected missing token account");
      })
    )
    .join("");

  const tokens = subAccounts
    .map(
      ta =>
        "\n  " +
        ta.type +
        " " +
        getAccountName(ta) +
        ": " +
        formatCurrencyUnit(getAccountUnit(ta), ta.balance, {
          showCode: true,
          disableRounding: true
        }) +
        " (" +
        ta.operations.length +
        " ops)"
    )
    .join("");

  return head + tokens + (summaryOnly ? "" : ops);
};

const stats = account => {
  const { subAccounts, operations } = account;

  const sumOfAllOpsNumber = operations.reduce(
    (sum: BigNumber, op) => sum.plus(getOperationAmountNumberWithInternals(op)),
    BigNumber(0)
  );

  const sumOfAllOps = formatCurrencyUnit(account.unit, sumOfAllOpsNumber, {
    showCode: true
  });

  const balance = formatCurrencyUnit(account.unit, account.balance, {
    showCode: true
  });

  return {
    balance,
    sumOfAllOps,
    opsCount: operations.length,
    subAccountsCount: (subAccounts || []).length
  };
};

const all: { [_: string]: (Account) => any } = {
  json: account => JSON.stringify(toAccountRaw(account)),
  default: account => cliFormat(account),
  summary: account => cliFormat(account, true),
  stats: account => stats(account),
  significantTokenTickers: account =>
    (account.subAccounts || [])
      .filter(isSignificantAccount)
      .map(ta => getAccountCurrency(ta).ticker)
      .join("\n")
};

export default all;
