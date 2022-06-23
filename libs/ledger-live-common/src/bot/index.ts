/* eslint-disable no-console */
import fs from "fs";
import path from "path";
import { BigNumber } from "bignumber.js";
import groupBy from "lodash/groupBy";
import { log } from "@ledgerhq/logs";
import invariant from "invariant";
import flatMap from "lodash/flatMap";
import { getEnv } from "../env";
import allSpecs from "../generated/specs";
import { Account } from "../types";
import type { MutationReport, SpecReport } from "./types";
import { promiseAllBatched } from "../promise";
import {
  findCryptoCurrencyByKeyword,
  isCurrencySupported,
  formatCurrencyUnit,
  getFiatCurrencyByTicker,
} from "../currencies";
import { isAccountEmpty, toAccountRaw } from "../account";
import { runWithAppSpec } from "./engine";
import { formatReportForConsole, formatError } from "./formatters";
import {
  initialState,
  loadCountervalues,
  inferTrackingPairForAccounts,
} from "../countervalues/logic";
import { getPortfolio } from "../portfolio/v2";
type Arg = Partial<{
  currency: string;
  family: string;
  mutation: string;
}>;
const usd = getFiatCurrencyByTicker("USD");

function makeAppJSON(accounts: Account[]) {
  const jsondata = {
    data: {
      settings: {
        hasCompletedOnboarding: true,
      },
      accounts: accounts.map((account) => ({
        data: toAccountRaw(account),
        version: 1,
      })),
    },
  };
  return JSON.stringify(jsondata);
}

export async function bot({ currency, family, mutation }: Arg = {}) {
  const SEED = getEnv("SEED");
  invariant(SEED, "SEED required");
  const specs: any[] = [];
  const specsLogs: string[][] = [];
  const maybeCurrency = currency
    ? findCryptoCurrencyByKeyword(currency)
    : undefined;
  const maybeFilterOnlyFamily = family;

  for (const family in allSpecs) {
    const familySpecs = allSpecs[family];
    if (maybeFilterOnlyFamily && maybeFilterOnlyFamily !== family) {
      continue;
    }

    for (const key in familySpecs) {
      let spec = familySpecs[key];

      if (!isCurrencySupported(spec.currency) || spec.disabled) {
        continue;
      }

      if (!maybeCurrency || maybeCurrency === spec.currency) {
        if (mutation) {
          spec = {
            ...spec,
            mutations: spec.mutation.filter((m) =>
              new RegExp(mutation).test(m.name)
            ),
          };
        }

        specs.push(spec);
      }
    }
  }

  const results: Array<SpecReport<any>> = await promiseAllBatched(
    getEnv("BOT_MAX_CONCURRENT"),
    specs,
    (spec) => {
      const logs: string[] = [];
      specsLogs.push(logs);
      return runWithAppSpec(spec, (message) => {
        log("bot", message);
        console.log(message);
        logs.push(message);
      }).catch((fatalError) => ({
        spec,
        fatalError,
        mutations: [],
        accountsBefore: [],
        accountsAfter: [],
      }));
    }
  );
  const allAccountsBefore = flatMap(results, (r) => r.accountsBefore || []);
  const allAccountsAfter = flatMap(results, (r) => r.accountsAfter || []);
  let countervaluesError;
  const countervaluesState = await loadCountervalues(initialState, {
    trackingPairs: inferTrackingPairForAccounts(allAccountsAfter, usd),
    autofillGaps: true,
  }).catch((e) => {
    console.error(e);
    countervaluesError = e;
    return null;
  });
  const period = "month";

  const portfolio = countervaluesState
    ? getPortfolio(allAccountsAfter, period, countervaluesState, usd)
    : null;
  const totalUSD = portfolio
    ? formatCurrencyUnit(
        usd.units[0],
        new BigNumber(
          portfolio.balanceHistory[portfolio.balanceHistory.length - 1].value
        ),
        {
          showCode: true,
        }
      )
    : "";
  const allMutationReports = flatMap(results, (r) => r.mutations || []);
  const mutationReports = allMutationReports.filter(
    (r) => r.mutation || r.error
  );
  const errorCases = allMutationReports.filter((r) => r.error);
  const specFatals = results.filter((r) => r.fatalError);
  const botHaveFailed = specFatals.length > 0 || errorCases.length > 0;
  const specsWithUncoveredMutations = results
    .map((r) => ({
      spec: r.spec,
      unavailableMutations: r.spec.mutations
        .map((mutation) => {
          if (
            r.mutations &&
            r.mutations.some((mr) => mr.mutation === mutation)
          ) {
            return;
          }

          const errors = (r.mutations || [])
            .map((mr) =>
              !mr.mutation && mr.unavailableMutationReasons
                ? mr.unavailableMutationReasons.find(
                    (r) => r.mutation === mutation
                  )
                : null
            )
            .filter(Boolean)
            .map(({ error }: any) => error);
          return {
            mutation,
            errors,
          };
        })
        .filter(Boolean),
    }))
    .filter((r) => r.unavailableMutations.length > 0);
  const uncoveredMutations = flatMap(
    specsWithUncoveredMutations,
    (s) => s.unavailableMutations
  );

  if (specFatals.length) {
    console.error(`================== SPEC ERRORS =====================\n`);
    specFatals.forEach((c) => {
      console.error(c.fatalError);
      console.error("");
    });
  }

  if (errorCases.length) {
    console.error(`================== MUTATION ERRORS =====================\n`);
    errorCases.forEach((c) => {
      console.error(formatReportForConsole(c));
      console.error(c.error);
      console.error("");
    });
    console.error(
      `/!\\ ${errorCases.length} failures out of ${mutationReports.length} mutations. Check above!\n`
    );
  }

  const withoutFunds = results
    .filter(
      (s) =>
        !s.fatalError &&
        ((s.accountsBefore && s.accountsBefore.every(isAccountEmpty)) ||
          (s.mutations && s.mutations.every((r) => !r.mutation)))
    )
    .map((s) => s.spec.name);
  const { GITHUB_RUN_ID, GITHUB_WORKFLOW } = process.env;

  let body = "";
  let title = "";
  const runURL = `https://github.com/LedgerHQ/ledger-live-common/actions/runs/${String(
    GITHUB_RUN_ID
  )}`;
  const success = mutationReports.length - errorCases.length;

  if (success > 0) {
    title += `✅ ${success} txs `;
  }

  if (errorCases.length) {
    title += `❌ ${errorCases.length} txs `;
  }

  if (specFatals.length) {
    title += ` ⚠️ ${specFatals.length} specs`;
  }

  if (countervaluesError) {
    title += `❌ countervalues`;
  } else {
    title += ` (${totalUSD})`;
  }

  let subtitle = "";

  if (countervaluesError) {
    subtitle += `> ${formatError(countervaluesError)}`;
  }

  let slackBody = "";
  body += `## ${title}`;

  if (GITHUB_RUN_ID && GITHUB_WORKFLOW) {
    body += ` for [**${GITHUB_WORKFLOW}**](${runURL})\n\n`;
  }

  body += "\n\n";
  body += subtitle;

  if (uncoveredMutations.length) {
    body += `> ⚠️ ${uncoveredMutations.length} mutations uncovered\n`;
  }

  body += "\n\n";

  if (specFatals.length) {
    body += "<details>\n";
    body += `<summary>${specFatals.length} critical spec errors</summary>\n\n`;
    specFatals.forEach(({ spec, fatalError }) => {
      body += `**Spec ${spec.name} failed!**\n`;
      body += "```\n" + formatError(fatalError) + "\n```\n\n";
      slackBody += `❌ *Spec ${spec.name}*: \`${formatError(fatalError)}\`\n`;
    });
    body += "</details>\n\n";
  }

  if (errorCases.length) {
    body += "<details>\n";
    body += `<summary>${errorCases.length} mutation errors</summary>\n\n`;
    errorCases.forEach((c) => {
      body +=
        "```\n" +
        formatReportForConsole(c) +
        "\n" +
        formatError(c.error) +
        "\n```\n\n";
    });
    body += "</details>\n\n";
  }

  body += "<details>\n";
  body += `<summary>Details of the ${mutationReports.length} mutations</summary>\n\n`;
  results.forEach((r, i) => {
    const spec = specs[i];
    const logs = specsLogs[i];
    body += `#### Spec ${spec.name} (${
      r.mutations ? r.mutations.length : "failed"
    })\n`;
    body += "\n```\n";
    body += logs.join("\n");

    if (r.mutations) {
      r.mutations.forEach((m) => {
        if (m.error || m.mutation) {
          body += formatReportForConsole(m) + "\n";
        }
      });
    }

    body += "\n```\n";
  });
  body += "</details>\n\n";

  if (uncoveredMutations.length > 0) {
    body += "<details>\n";
    body += `<summary>Details of the ${uncoveredMutations.length} uncovered mutations</summary>\n\n`;
    specsWithUncoveredMutations.forEach(({ spec, unavailableMutations }) => {
      body += `#### Spec ${spec.name} (${unavailableMutations.length})\n`;
      unavailableMutations.forEach((m) => {
        // FIXME: we definitely got to stop using Maybe types or | undefined | null
        if (!m) return;
        const msgs = groupBy(m.errors.map((e) => e.message));
        body +=
          "- **" +
          m.mutation.name +
          "**: " +
          Object.keys(msgs)
            .map((msg) => `${msg} (${msgs[msg].length})`)
            .join(", ") +
          "\n";
      });
    });
    body += "</details>\n\n";
  }

  body += "### Portfolio" + (totalUSD ? " (" + totalUSD + ")" : "") + "\n\n";

  if (withoutFunds.length) {
    body += `> ⚠️ ${
      withoutFunds.length
    } specs don't have enough funds! (${withoutFunds.join(", ")})\n`;
  }

  body += "<details>\n";
  body += `<summary>Details of the ${results.length} currencies</summary>\n\n`;
  body += "| Spec (accounts) | Operations | Balance | funds? |\n";
  body += "|-----------------|------------|---------|--------|\n";
  results.forEach((r) => {
    function sumAccounts(all) {
      if (!all || all.length === 0) return;
      return all.reduce(
        (sum, a) => sum.plus(a.spendableBalance),
        new BigNumber(0)
      );
    }

    const accountsBeforeBalance = sumAccounts(r.accountsBefore);
    const accountsAfterBalance = sumAccounts(r.accountsAfter);
    let balance = !accountsBeforeBalance
      ? "🤷‍♂️"
      : "**" +
        formatCurrencyUnit(r.spec.currency.units[0], accountsBeforeBalance, {
          showCode: true,
        }) +
        "**";
    let etaTxs =
      r.mutations && r.mutations.every((m) => !m.mutation) ? "❌" : "???";

    if (
      accountsBeforeBalance &&
      accountsAfterBalance &&
      accountsAfterBalance.lt(accountsBeforeBalance)
    ) {
      const txCount = r.mutations
        ? r.mutations.filter((m) => m.operation).length
        : 0;
      const d = accountsBeforeBalance.minus(accountsAfterBalance);
      balance += " (- " + formatCurrencyUnit(r.spec.currency.units[0], d) + ")";
      const eta = accountsAfterBalance.div(d.div(txCount)).integerValue();
      etaTxs = eta.lt(50) ? "⚠️" : eta.lt(500) ? "👍" : "💪";
    }

    if (countervaluesState && r.accountsAfter) {
      const portfolio = getPortfolio(
        r.accountsAfter,
        period,
        countervaluesState,
        usd
      );
      const totalUSD = portfolio
        ? formatCurrencyUnit(
            usd.units[0],
            new BigNumber(
              portfolio.balanceHistory[
                portfolio.balanceHistory.length - 1
              ].value
            ),
            {
              showCode: true,
            }
          )
        : "";
      balance += " (" + totalUSD + ")";
    }

    function countOps(all) {
      if (!all) return 0;
      return all.reduce((sum, a) => sum + a.operations.length, 0);
    }

    const beforeOps = countOps(r.accountsBefore);
    const afterOps = countOps(r.accountsAfter);
    const firstAccount = (r.accountsAfter || r.accountsBefore || [])[0];
    body += `| ${r.spec.name} (${
      (r.accountsBefore || []).filter((a) => a.used).length
    }) `;
    body += `| ${afterOps || beforeOps}${
      afterOps > beforeOps ? ` (+${afterOps - beforeOps})` : ""
    } `;
    body += `| ${balance} `;
    body += `| ${etaTxs} ${(firstAccount && firstAccount.freshAddress) || ""} `;
    body += "|\n";
  });
  body += "\n</details>\n\n";

  const { BOT_REPORT_FOLDER } = process.env;

  const slackCommentTemplate = `${String(
    GITHUB_WORKFLOW
  )}: ${title} (<{{url}}|details> – <${runURL}|logs>)\n${subtitle}${slackBody}`;

  if (BOT_REPORT_FOLDER) {
    await Promise.all([
      fs.promises.writeFile(
        path.join(BOT_REPORT_FOLDER, "full-report.md"),
        body,
        "utf-8"
      ),
      fs.promises.writeFile(
        path.join(BOT_REPORT_FOLDER, "slack-comment-template.md"),
        slackCommentTemplate,
        "utf-8"
      ),
      fs.promises.writeFile(
        path.join(BOT_REPORT_FOLDER, "before-app.json"),
        makeAppJSON(allAccountsBefore),
        "utf-8"
      ),
      fs.promises.writeFile(
        path.join(BOT_REPORT_FOLDER, "after-app.json"),
        makeAppJSON(allAccountsAfter),
        "utf-8"
      ),
    ]);
  }

  if (botHaveFailed) {
    let txt = "";
    specFatals.forEach(({ spec, fatalError }) => {
      txt += `${spec.name} got ${String(fatalError)}\n`;
    });
    errorCases.forEach((c: MutationReport<any>) => {
      txt += `in ${c.spec.name}`;
      if (c.account) txt += `/${c.account.name}`;
      if (c.mutation) txt += `/${c.mutation.name}`;
      txt += ` got ${String(c.error)}\n`;
    });
    // throw new Error(txt);
    console.error(txt);
  }
}
