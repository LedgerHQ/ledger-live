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
import byFamily from "../generated/account";

const isSignificantAccount = (acc) =>
  acc.balance.gt(10 ** (getAccountUnit(acc).magnitude - 6));

const formatOp = (
  unitByAccountId: (arg0: string) => Unit | null | undefined,
  familySpecific: (arg0: Operation, arg1: Unit | null | undefined) => string
) => {
  const format = (op: Operation, level = 0) => {
    const unit = unitByAccountId(op.accountId);
    const amountBN = getOperationAmountNumber(op);
    const amount = unit
      ? formatCurrencyUnit(unit, amountBN, {
          showCode: true,
          alwaysShowSign: true,
          disableRounding: true,
        })
      : "? " + amountBN.toString();
    const spaces = Array((level + 1) * 2)
      .fill(" ")
      .join("");
    let extra =
      level > 0
        ? ""
        : `${op.hash} ${op.date
            .toISOString()
            .split(":")
            .slice(0, 2)
            .join(":")}`;
    extra += familySpecific(op, unit);
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
    new BigNumber(0)
  );
  if (sumOfOps.eq(balance)) return "";
  return (
    " (! sum of ops " +
    formatCurrencyUnit(unit, sumOfOps, {
      showCode: true,
      disableRounding: true,
    }) +
    ")"
  );
}

const cliFormat = (account, level?: string) => {
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
  const opsCount = `${operations.length}ops`;
  const freshInfo = `${freshAddress} on ${freshAddressPath}`;
  const derivationInfo = `${derivationMode}#${index}`;
  let str = `${name}: ${balance} (${opsCount}) (${freshInfo}) ${derivationInfo} ${
    xpub || ""
  }`;
  if (level === "head") return str;
  str += maybeDisplaySumOfOpsIssue(
    operations,
    account.balance,
    getAccountUnit(account)
  );
  const family = byFamily[account.currency.family];

  if (family && family.formatAccountSpecifics) {
    str += family.formatAccountSpecifics(account);
  }

  const subAccounts = account.subAccounts || [];
  str += subAccounts
    .map(
      (ta) =>
        "  " +
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
    .join("\n");
  if (level === "basic") return str;
  str += "\nOPERATIONS (" + operations.length + ")";
  str += operations
    .map(
      formatOp(
        (id) => {
          if (account.id === id) return account.unit;
          const ta = subAccounts.find((a) => a.id === id);
          if (ta) return getAccountUnit(ta);
          console.error("unexpected missing token account " + id);
        },
        (operation, unit) => {
          if (family && family.formatOperationSpecifics) {
            return family.formatOperationSpecifics(operation, unit);
          }

          return "";
        }
      )
    )
    .join("");
  return str;
};

const stats = (account) => {
  const { subAccounts, operations } = account;
  const sumOfAllOpsNumber = operations.reduce(
    (sum: BigNumber, op) => sum.plus(getOperationAmountNumberWithInternals(op)),
    new BigNumber(0)
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

export const accountFormatters: Record<string, (arg0: Account) => any> = {
  json: (account) => JSON.stringify(toAccountRaw(account)),
  head: (account) => cliFormat(account, "head"),
  default: (account) => cliFormat(account),
  basic: (account) => cliFormat(account, "basic"),
  full: (account) => cliFormat(account, "full"),
  stats: (account) => stats(account),
  significantTokenTickers: (account) =>
    (account.subAccounts || [])
      .filter(isSignificantAccount)
      .map((ta) => getAccountCurrency(ta).ticker)
      .join("\n"),
};
export function formatAccount(account: Account, format = "full"): string {
  const f = accountFormatters[format];
  invariant(f, "missing account formatter=" + format);
  return f(account);
}
export function formatOperation(
  account: Account | null | undefined
): (arg0: Operation) => string {
  const unitByAccountId = (id: string) => {
    if (!account) return;
    if (account.id === id) return account.unit;
    const ta = (account.subAccounts || []).find((a) => a.id === id);
    if (ta) return getAccountUnit(ta);
  };

  const familyExtra = (operation, unit) => {
    if (!account) return "";
    const family = byFamily[account.currency.family];

    if (family && family.formatOperationSpecifics) {
      return family.formatOperationSpecifics(operation, unit);
    }

    return "";
  };

  return formatOp(unitByAccountId, familyExtra);
}
