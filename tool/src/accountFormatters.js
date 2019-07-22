// @flow

import { BigNumber } from "bignumber.js";
import {
  toAccountRaw,
  getAccountCurrency
} from "@ledgerhq/live-common/lib/account";
import { getOperationAmountNumberWithInternals } from "@ledgerhq/live-common/lib/operation";
import { formatCurrencyUnit } from "@ledgerhq/live-common/lib/currencies";
import { getOperationAmountNumber } from "@ledgerhq/live-common/lib/operation";

// TODO move to live common
const isSignificantAccount = acc =>
  acc.balance.gt(10 ** (getAccountCurrency(acc).units[0].magnitude - 6));

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
    const extra = level > 0 ? "" : ` ${op.hash}     ${op.date.toGMTString()}`;
    const head = `${(spaces + amount).padEnd(26)} ${extra}`;
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
  const head = `${name}: ${balance} (${opsCount}) (${freshInfo}) (${derivationInfo} ${xpub})`;

  const tokenAccounts = account.tokenAccounts || [];
  const ops = operations
    .map(
      formatOp(id =>
        account.id === id
          ? account.unit
          : tokenAccounts.find(a => a.id === id).token.units[0]
      )
    )
    .join("");

  const tokens = tokenAccounts
    .map(
      ta =>
        "\n  TOKEN " +
        ta.token.name +
        ": " +
        formatCurrencyUnit(ta.token.units[0], ta.balance, {
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
  const { tokenAccounts, operations } = account;

  const sumOfAllOpsNumber = operations.reduce(
    (sum, op) => sum.plus(getOperationAmountNumberWithInternals(op)),
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
    tokenAccountsCount: (tokenAccounts || []).length
  };
};

export default {
  json: account => JSON.stringify(toAccountRaw(account)),
  default: account => cliFormat(account),
  summary: account => cliFormat(account, true),
  stats: account => stats(account),
  significantTokenTickers: account =>
    (account.tokenAccounts || [])
      .filter(isSignificantAccount)
      .map(ta => ta.token.ticker)
      .join("\n")
};
