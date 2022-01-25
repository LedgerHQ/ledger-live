import { map } from "rxjs/operators";
import type {
  CompoundAccountSummary,
  LoansLikeArray,
} from "@ledgerhq/live-common/lib/compound/types";
import {
  formatCurrencyUnit,
  findCompoundToken,
} from "@ledgerhq/live-common/lib/currencies";
import { makeCompoundSummaryForAccount } from "@ledgerhq/live-common/lib/compound/logic";
import type { TokenAccount, Account } from "@ledgerhq/live-common/lib/types";
import { scan, scanCommonOpts } from "../scan";
import type { ScanCommonOpts } from "../scan";

const formatDate = (date: Date): string => {
  const ye = new Intl.DateTimeFormat("en", {
    year: "numeric",
  }).format(date);
  const mo = new Intl.DateTimeFormat("en", {
    month: "short",
  }).format(date);
  const da = new Intl.DateTimeFormat("en", {
    day: "2-digit",
  }).format(date);
  return `${da}-${mo}-${ye}`;
};

const createLoanHeader = (
  summary: CompoundAccountSummary,
  strings: string[],
  account: TokenAccount,
  parentAccount: Account | null | undefined
) => {
  const { totalSupplied, allTimeEarned, status } = summary;
  strings.push("\n");
  strings.push(
    `Compound Summary for account ${
      parentAccount ? parentAccount.id : account ? account.id : ""
    }`
  );
  strings.push("\n");

  if (status) {
    strings.push(`Status: ${status}`);
    strings.push("\n");
  }

  strings.push("-------------------------------");
  strings.push("\n");
  strings.push(`${account.token.ticker} supplied`.padStart(16));
  strings.push(" | ");
  strings.push(`${account.token.ticker} earned`.padStart(16));
  strings.push(" | ");
  strings.push("\n");
  strings.push(
    `${formatCurrencyUnit(account.token.units[0], totalSupplied)}`.padStart(16)
  );
  strings.push(" | ");
  strings.push(
    `${formatCurrencyUnit(account.token.units[0], allTimeEarned)}`.padStart(16)
  );
  strings.push(" | ");
  strings.push("\n");
  strings.push("-------------------------------");
  strings.push("\n");
  return strings;
};

const createLoanDisplay = (
  loans: LoansLikeArray,
  strings: string[],
  title: string,
  account: TokenAccount
): string[] => {
  strings.push(title);
  strings.push("\n");
  strings.push(`Starting Date`.padStart(16));
  strings.push(" | ");
  strings.push(`Ending Date`.padStart(16));
  strings.push(" | ");
  strings.push(`${account.token.ticker}`.padStart(16));
  strings.push(" | ");
  strings.push(`${account.token.ticker} Earned`.padStart(16));
  strings.push(" | ");
  strings.push(`Interests Accrued (%)`.padStart(22));
  strings.push(" | ");
  strings.push("\n");
  loans.forEach(
    ({
      startingDate,
      // @ts-expect-error composite type, endDate doesn't exist on one subtype
      endDate,
      amountSupplied,
      interestsEarned,
      percentageEarned,
    }) => {
      strings.push(formatDate(startingDate).padStart(16));
      strings.push(" | ");
      strings.push((endDate ? formatDate(endDate) : "-").padStart(16));
      strings.push(" | ");
      strings.push(
        `${formatCurrencyUnit(
          account.token.units[0],
          amountSupplied
        )}`.padStart(16)
      );
      strings.push(" | ");
      strings.push(
        `${formatCurrencyUnit(
          account.token.units[0],
          interestsEarned
        )}`.padStart(16)
      );
      strings.push(" | ");
      strings.push(`${Math.round(percentageEarned * 100) / 100}`.padStart(22));
      strings.push(" | ");
      strings.push("\n");
    }
  );
  strings.push("-------------------------------");
  strings.push("\n");
  return strings;
};

const compoundSummaryFormatter = {
  summary: (summary: CompoundAccountSummary): string => {
    if (!summary) return "";
    const {
      account,
      totalSupplied,
      allTimeEarned,
      accruedInterests,
      opened,
      closed,
    } = summary;
    return JSON.stringify({
      accountId: account.id,
      totalSupplied: totalSupplied.toString(),
      allTimeEarned: allTimeEarned.toString(),
      accruedInterests: accruedInterests.toString(),
      opened: opened.map(({ ...op }) => ({
        startingDate: op.startingDate.toString(),
        interestsEarned: op.interestsEarned.toString(),
        amountSupplied: op.amountSupplied.toString(),
        percentageEarned: op.percentageEarned.toString(),
      })),
      closed: closed.map(({ ...op }) => ({
        startingDate: op.startingDate.toString(),
        amountSupplied: op.amountSupplied.toString(),
        interestsEarned: op.interestsEarned.toString(),
        percentageEarned: op.percentageEarned.toString(),
      })),
    });
  },
  default: (summary: CompoundAccountSummary): string => {
    const { opened, closed, account, parentAccount } = summary;
    if (opened.length === 0 && closed.length === 0) return "";
    if (account.type !== "TokenAccount") return "";
    const strings = [];
    createLoanHeader(summary, strings, account, parentAccount);
    createLoanDisplay(opened, strings, "OPENED LOANS", account);
    createLoanDisplay(closed, strings, "CLOSED LOANS", account);
    return strings.join("");
  },
};
export default {
  description: "Create a summary of compound operations (ETH)",
  args: [
    ...scanCommonOpts,
    {
      name: "format",
      alias: "f",
      type: String,
      typeDesc: Object.keys(compoundSummaryFormatter).join(" | "),
      desc: "how to display the data",
    },
  ],
  job: (
    opts: ScanCommonOpts & {
      format: keyof typeof compoundSummaryFormatter;
    }
  ) =>
    scan(opts).pipe(
      map((account) => {
        const result: string[] = [];
        if (!account?.subAccounts?.length) return "";
        const formatter = compoundSummaryFormatter[opts.format || "default"];
        account.subAccounts.forEach((s) => {
          if (s.type !== "TokenAccount") return;
          if (!findCompoundToken(s.token)) return;
          const sum = makeCompoundSummaryForAccount(s, account);
          if (!sum) return;
          const summary = formatter(sum);
          result.push(summary);
        });
        return result.join("");
      })
    ),
};
