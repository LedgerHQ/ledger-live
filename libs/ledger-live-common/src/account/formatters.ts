import { getAccountCurrency } from "@ledgerhq/ledger-wallet-framework/account/index";
import { getTagDerivationMode } from "@ledgerhq/ledger-wallet-framework/derivation";
import {
  getOperationAmountNumber,
  getOperationAmountNumberWithInternals,
} from "@ledgerhq/ledger-wallet-framework/operation";
import { getDefaultAccountName } from "@ledgerhq/live-wallet/accountName";
import type { Unit } from "@ledgerhq/types-cryptoassets";
import type { Account, Operation } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import invariant from "invariant";
import { formatCurrencyUnit } from "../currencies";
import { toAccountRaw } from "./serialization";
import { getAccountBridge } from "../bridge";

const isSignificantAccount = acc =>
  acc.balance.gt(10 ** (getAccountCurrency(acc).units[0].magnitude - 6));

const formatOp = (
  unitByAccountId: (arg0: string) => Unit | null | undefined,
  familySpecific: (arg0: Operation, arg1: Unit | null | undefined) => string,
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
      level > 0 ? "" : `${op.hash} ${op.date.toISOString().split(":").slice(0, 2).join(":")}`;
    extra += familySpecific(op, unit);
    const head = `${(spaces + amount).padEnd(20)} ${(
      (op.hasFailed ? "❌" : "") +
      op.type +
      " "
    ).padEnd(11)}${extra}`;
    const sub = (op.subOperations || [])
      .concat(op.internalOperations || [])
      .map(subop => format(subop, level + 1))
      .join("");
    return `\n${head}${sub}`;
  };

  return (op: Operation) => format(op, 0);
};

function maybeDisplaySumOfOpsIssue(ops, balance, unit) {
  const sumOfOps = ops.reduce(
    (sum, op) => sum.plus(getOperationAmountNumber(op)),
    new BigNumber(0),
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

const cliFormat = async (account, level?: string): Promise<string> => {
  const { id, name, freshAddress, freshAddressPath, derivationMode, index, operations } = account;
  const tag = getTagDerivationMode(account.currency, derivationMode);
  const balance = formatCurrencyUnit(getAccountCurrency(account).units[0], account.balance, {
    showCode: true,
  });
  const opsCount = `${operations.length}ops`;
  const freshInfo = `${freshAddress} on ${freshAddressPath}`;
  const derivationInfo = `${derivationMode}#${index}`;
  let str = `${name}${
    tag ? " [" + tag + "]" : ""
  }: ${balance} (${opsCount}) (${freshInfo}) ${derivationInfo} ${id || ""}`;
  if (level === "head") return str;
  str += maybeDisplaySumOfOpsIssue(
    operations,
    account.balance,
    getAccountCurrency(account).units[0],
  );

  const bridge = await getAccountBridge(account);
  if (bridge.formatAccountSpecifics) {
    str += bridge.formatAccountSpecifics(account);
    str += "\n";
  }

  const subAccounts = account.subAccounts || [];
  str += subAccounts
    .map(
      ta =>
        "  " +
        ta.type +
        " " +
        getDefaultAccountName(ta) +
        ": " +
        formatCurrencyUnit(getAccountCurrency(ta).units[0], ta.balance, {
          showCode: true,
          disableRounding: true,
        }) +
        " (" +
        ta.operations.length +
        " ops)" +
        maybeDisplaySumOfOpsIssue(ta.operations, ta.balance, getAccountCurrency(ta).units[0]),
    )
    .join("\n");

  if (level === "basic") return str;
  str += "\nOPERATIONS (" + operations.length + ")";
  str += operations
    .map(
      formatOp(
        id => {
          if (account.id === id) return getAccountCurrency(account).units[0];
          const ta = subAccounts.find(a => a.id === id);
          if (ta) return getAccountCurrency(ta).units[0];
          console.error("unexpected missing token account " + id);
        },
        (operation, unit) => bridge.formatOperationSpecifics?.(operation, unit) ?? "",
      ),
    )
    .join("");
  return str;
};

const stats = account => {
  const { subAccounts, operations } = account;
  const sumOfAllOpsNumber = operations.reduce(
    (sum: BigNumber, op) => sum.plus(getOperationAmountNumberWithInternals(op)),
    new BigNumber(0),
  );
  const sumOfAllOps = formatCurrencyUnit(getAccountCurrency(account).units[0], sumOfAllOpsNumber, {
    showCode: true,
  });
  const balance = formatCurrencyUnit(getAccountCurrency(account).units[0], account.balance, {
    showCode: true,
  });
  return {
    balance,
    sumOfAllOps,
    opsCount: operations.length,
    subAccountsCount: (subAccounts || []).length,
  };
};

// this is developped for debug purpose in order to compare with balance APIs
const operationBalanceHistoryBackwards = account => {
  let acc = account.balance;
  return JSON.stringify(
    account.operations
      .map(op => {
        const { blockHeight } = op;
        const date = op.date.toISOString();
        const balance = acc.toNumber();
        acc = acc.minus(getOperationAmountNumberWithInternals(op));
        return { blockHeight, date, balance };
      })
      .reverse(),
  );
};
const operationBalanceHistory = account => {
  let acc = new BigNumber(0);
  return JSON.stringify(
    account.operations
      .slice(0)
      .reverse()
      .map(op => {
        acc = acc.plus(getOperationAmountNumberWithInternals(op));
        const { blockHeight } = op;
        const date = op.date.toISOString();
        const balance = acc.toNumber();
        return { blockHeight, date, balance };
      }),
  );
};

export const accountFormatters: { [_: string]: (Account) => any } = {
  operationBalanceHistoryBackwards,
  operationBalanceHistory,
  json: async account => JSON.stringify(await toAccountRaw(account)),
  head: account => cliFormat(account, "head"),
  default: account => cliFormat(account),
  basic: account => cliFormat(account, "basic"),
  full: account => cliFormat(account, "full"),
  stats: account => stats(account),
  significantTokenTickers: account =>
    (account.subAccounts || [])
      .filter(isSignificantAccount)
      .map(ta => getAccountCurrency(ta).ticker)
      .join("\n"),
};
export async function formatAccount(account: Account, format = "full"): Promise<string> {
  const f = accountFormatters[format];
  invariant(f, "missing account formatter=" + format);
  return f(account);
}
export async function formatOperation(
  account: Account | null | undefined,
): Promise<(arg0: Operation) => string> {
  const unitByAccountId = (id: string) => {
    if (!account) return;
    if (account.id === id) return getAccountCurrency(account).units[0];
    const ta = (account.subAccounts || []).find(a => a.id === id);
    if (ta) return getAccountCurrency(ta).units[0];
  };

  const bridge = account ? await getAccountBridge(account) : null;
  const familyExtra = (operation, unit) =>
    bridge?.formatOperationSpecifics?.(operation, unit) ?? "";

  return formatOp(unitByAccountId, familyExtra);
}
