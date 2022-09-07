/* eslint-disable no-console */
import fs from "fs";
import path from "path";
import { BigNumber } from "bignumber.js";
import uniq from "lodash/uniq";
import groupBy from "lodash/groupBy";
import { log } from "@ledgerhq/logs";
import invariant from "invariant";
import flatMap from "lodash/flatMap";
import { getEnv } from "../env";
import allSpecs from "../generated/specs";
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
import { formatReportForConsole, formatError, formatTime } from "./formatters";
import {
  initialState,
  loadCountervalues,
  inferTrackingPairForAccounts,
} from "../countervalues/logic";
import { getPortfolio } from "../portfolio/v2";
import { Account } from "@ledgerhq/types-live";
import { getContext } from "./bot-test-context";
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

export async function bot({
  currency,
  family,
  mutation,
}: Arg = {}): Promise<void> {
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

  const timeBefore = Date.now();
  const results: Array<SpecReport<any>> = await promiseAllBatched(
    getEnv("BOT_MAX_CONCURRENT"),
    specs,
    (spec) => {
      const logs: string[] = [];
      specsLogs.push(logs);
      return runWithAppSpec(spec, (message) => {
        log("bot", message);
        if (process.env.CI) console.log(message);
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
  const totalDuration = Date.now() - timeBefore;
  const allAppPaths = uniq(results.map((r) => r.appPath || "").sort());
  const allAccountsAfter = flatMap(results, (r) => r.accountsAfter || []);
  let countervaluesError;
  const countervaluesState = await loadCountervalues(initialState, {
    trackingPairs: inferTrackingPairForAccounts(allAccountsAfter, usd),
    autofillGaps: true,
  }).catch((e) => {
    if (process.env.CI) console.error(e);
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

  if (specFatals.length && process.env.CI) {
    console.error(`================== SPEC ERRORS =====================\n`);
    specFatals.forEach((c) => {
      console.error(c.fatalError);
      console.error("");
    });
  }

  if (errorCases.length && process.env.CI) {
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

  const specsWithoutFunds = results.filter(
    (s) =>
      !s.fatalError &&
      ((s.accountsBefore && s.accountsBefore.every(isAccountEmpty)) ||
        (s.mutations && s.mutations.every((r) => !r.mutation)))
  );

  const fullySuccessfulSpecs = results.filter(
    (s) =>
      !s.fatalError &&
      s.mutations &&
      !specsWithoutFunds.includes(s) &&
      s.mutations.every((r) => !r.mutation || r.operation)
  );

  const specsWithErrors = results.filter(
    (s) =>
      !s.fatalError &&
      s.mutations &&
      !specsWithoutFunds.includes(s) &&
      s.mutations.some((r) => r.mutation && !r.operation)
  );

  const specsWithoutOperations = results.filter(
    (s) =>
      !s.fatalError &&
      !specsWithoutFunds.includes(s) &&
      !specsWithErrors.includes(s) &&
      s.mutations &&
      s.mutations.every((r) => !r.operation)
  );

  const withoutFunds = specsWithoutFunds
    .filter(
      (s) =>
        // ignore coin that are backed by testnet that have funds
        !results.some(
          (o) =>
            o.spec.currency.isTestnetFor === s.spec.currency.id &&
            !specsWithoutFunds.includes(o)
        )
    )
    .map((s) => s.spec.name);

  const { GITHUB_RUN_ID, GITHUB_WORKFLOW } = process.env;

  let body = "";
  let githubBody = "";
  function appendBody(content) {
    body += content;
    githubBody += content;
  }
  function appendBodyFullOnly(content) {
    body += content;
  }

  let title = "";
  const runURL = `https://github.com/LedgerHQ/ledger-live/actions/runs/${String(
    GITHUB_RUN_ID
  )}`;
  const success = mutationReports.length - errorCases.length;

  title += `⏲ ${formatTime(totalDuration)} `;

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
  appendBody(`## ${title}`);

  if (GITHUB_RUN_ID && GITHUB_WORKFLOW) {
    appendBody(` for [**${GITHUB_WORKFLOW}**](${runURL})\n\n`);
  }

  appendBody("\n\n");
  appendBody(subtitle);

  if (fullySuccessfulSpecs.length) {
    const msg = `> ✅ ${
      fullySuccessfulSpecs.length
    } specs are successful: _${fullySuccessfulSpecs
      .map((o) => o.spec.name)
      .join(", ")}_\n`;
    appendBody(msg);
    slackBody += msg;
  }

  if (specsWithErrors.length) {
    const msg = `> ❌ ${
      specsWithErrors.length
    } specs have problems: _${specsWithErrors
      .map((o) => o.spec.name)
      .join(", ")}_\n`;
    appendBody(msg);
    slackBody += msg;
  }

  if (withoutFunds.length) {
    const missingFundsWarn = `> 💰 ${
      withoutFunds.length
    } specs may miss funds: _${withoutFunds.join(", ")}_\n`;
    appendBody(missingFundsWarn);
    slackBody += missingFundsWarn;
  }

  if (specsWithoutOperations.length) {
    const warn = `> ⚠️ ${
      specsWithoutOperations.length
    } specs may have issues: *${specsWithoutOperations
      .map((o) => o.spec.name)
      .join(", ")}*\n`;
    appendBody(warn);
    slackBody += warn;
  }

  appendBody("\n\n");

  if (specFatals.length) {
    appendBody("<details>\n");
    appendBody(
      `<summary>${specFatals.length} critical spec errors</summary>\n\n`
    );
    specFatals.forEach(({ spec, fatalError }) => {
      appendBody(`**Spec ${spec.name} failed!**\n`);
      appendBody("```\n" + formatError(fatalError, true) + "\n```\n\n");
      slackBody += `❌ *Spec ${spec.name}*: \`${formatError(fatalError)}\`\n`;
    });
    appendBody("</details>\n\n");
  }

  // summarize the error causes
  const dedupedErrorCauses: string[] = [];
  errorCases.forEach((m) => {
    if (!m.error) return;
    const ctx = getContext(m.error);
    if (!ctx) return;
    const cause = m.spec.name + " > " + ctx;
    if (!dedupedErrorCauses.includes(cause)) {
      dedupedErrorCauses.push(cause);
    }
  });
  if (dedupedErrorCauses.length > 0) {
    slackBody += "*Hints:*\n";
    dedupedErrorCauses.forEach((cause) => {
      slackBody += `- ${cause}\n`;
    });
  }

  if (errorCases.length) {
    appendBody("<details>\n");
    appendBody(`<summary>${errorCases.length} mutation errors</summary>\n\n`);
    errorCases.forEach((c) => {
      appendBody("```\n" + formatReportForConsole(c) + "\n```\n\n");
    });
    appendBody("</details>\n\n");
  }

  appendBodyFullOnly("<details>\n");

  appendBodyFullOnly(
    `<summary>Details of the ${mutationReports.length} mutations</summary>\n\n`
  );
  results.forEach((r, i) => {
    const spec = specs[i];
    const logs = specsLogs[i];
    appendBodyFullOnly(
      `#### Spec ${spec.name} (${
        r.mutations ? r.mutations.length : "failed"
      })\n`
    );
    appendBodyFullOnly("\n```\n");
    appendBodyFullOnly(logs.join("\n"));

    if (r.mutations) {
      r.mutations.forEach((m) => {
        if (m.error || m.mutation) {
          appendBodyFullOnly(formatReportForConsole(m) + "\n");
        }
      });
    }

    appendBodyFullOnly("\n```\n");
  });
  appendBodyFullOnly("</details>\n\n");

  if (uncoveredMutations.length > 0) {
    appendBodyFullOnly("<details>\n");
    appendBodyFullOnly(
      `<summary>Details of the ${uncoveredMutations.length} uncovered mutations</summary>\n\n`
    );
    specsWithUncoveredMutations.forEach(({ spec, unavailableMutations }) => {
      appendBodyFullOnly(
        `#### Spec ${spec.name} (${unavailableMutations.length})\n`
      );
      unavailableMutations.forEach((m) => {
        // FIXME: we definitely got to stop using Maybe types or | undefined | null
        if (!m) return;
        const msgs = groupBy(m.errors.map((e) => e.message));
        appendBodyFullOnly(
          "- **" +
            m.mutation.name +
            "**: " +
            Object.keys(msgs)
              .map((msg) => `${msg} (${msgs[msg].length})`)
              .join(", ") +
            "\n"
        );
      });
    });
    appendBodyFullOnly("</details>\n\n");
  }

  appendBody("<details>\n");
  appendBody(
    `<summary>Portfolio ${
      totalUSD ? " (" + totalUSD + ")" : ""
    } – Details of the ${results.length} currencies</summary>\n\n`
  );
  appendBody("| Spec (accounts) | Operations | Balance | funds? |\n");
  appendBody("|-----------------|------------|---------|--------|\n");
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
    appendBody(
      `| ${r.spec.name} (${
        (r.accountsBefore || []).filter((a) => a.used).length
      }) `
    );
    appendBody(
      `| ${afterOps || beforeOps}${
        afterOps > beforeOps ? ` (+${afterOps - beforeOps})` : ""
      } `
    );
    appendBody(`| ${balance} `);
    appendBody(
      `| ${etaTxs} ${(firstAccount && firstAccount.freshAddress) || ""} `
    );
    appendBody("|\n");
  });
  appendBody("\n</details>\n\n");

  // Add performance details
  appendBody("<details>\n");
  appendBody(
    `<summary>Performance ⏲ ${formatTime(totalDuration)}</summary>\n\n`
  );
  appendBody("**Time spent for each spec:** (total across mutations)\n");

  function sumMutation(mutations, f) {
    return mutations?.reduce((sum, m) => sum + (f(m) || 0), 0) || 0;
  }
  function sumResults(f) {
    return results.reduce((sum, r) => sum + (f(r) || 0), 0);
  }
  function sumResultsMutation(f) {
    return sumResults((r) => sumMutation(r.mutations, f));
  }

  appendBody(
    "| Spec (accounts) | preload | scan | re-sync | tx status | sign op | broadcast | mutation confirm |\n"
  );
  appendBody("|---|---|---|---|---|---|---|---|\n");

  appendBody("| **TOTAL** |");
  appendBody(`**${formatTime(sumResults((r) => r.preloadDuration))}** |`);
  appendBody(`**${formatTime(sumResults((r) => r.scanDuration))}** |`);
  appendBody(
    `**${formatTime(
      sumResultsMutation((m) => m.resyncAccountsDuration || 0)
    )}** |`
  );
  appendBody(
    `**${formatTime(
      sumResultsMutation((m) =>
        m.mutationTime && m.statusTime ? m.statusTime - m.mutationTime : 0
      )
    )}** |`
  );
  appendBody(
    `**${formatTime(
      sumResultsMutation((m) =>
        m.statusTime && m.signedTime ? m.signedTime - m.statusTime : 0
      )
    )}** |`
  );
  appendBody(
    `**${formatTime(
      sumResultsMutation((m) =>
        m.signedTime && m.broadcastedTime ? m.broadcastedTime - m.signedTime : 0
      )
    )}** |`
  );
  appendBody(
    `**${formatTime(
      sumResultsMutation((m) =>
        m.broadcastedTime && m.confirmedTime
          ? m.confirmedTime - m.broadcastedTime
          : 0
      )
    )}** |\n`
  );

  results.forEach((r) => {
    appendBody(
      `| ${r.spec.name} (${
        (r.accountsBefore || []).filter((a) => a.used).length
      }) |`
    );
    appendBody(`${formatTime(r.preloadDuration || 0)} |`);
    appendBody(`${formatTime(r.scanDuration || 0)} |`);
    appendBody(
      `${formatTime(
        sumMutation(r.mutations, (m) => m.resyncAccountsDuration || 0)
      )} |`
    );
    appendBody(
      `${formatTime(
        sumMutation(r.mutations, (m) =>
          m.mutationTime && m.statusTime ? m.statusTime - m.mutationTime : 0
        )
      )} |`
    );
    appendBody(
      `${formatTime(
        sumMutation(r.mutations, (m) =>
          m.statusTime && m.signedTime ? m.signedTime - m.statusTime : 0
        )
      )} |`
    );
    appendBody(
      `${formatTime(
        sumMutation(r.mutations, (m) =>
          m.signedTime && m.broadcastedTime
            ? m.broadcastedTime - m.signedTime
            : 0
        )
      )} |`
    );
    appendBody(
      `${formatTime(
        sumMutation(r.mutations, (m) =>
          m.broadcastedTime && m.confirmedTime
            ? m.confirmedTime - m.broadcastedTime
            : 0
        )
      )} |\n`
    );
  });

  appendBody("\n</details>\n\n");

  const { BOT_REPORT_FOLDER } = process.env;

  const slackCommentTemplate = `${String(
    GITHUB_WORKFLOW
  )}: ${title} (<{{url}}|details> – <${runURL}|logs>)\n${subtitle}${slackBody}`;

  if (BOT_REPORT_FOLDER) {
    await Promise.all([
      fs.promises.writeFile(
        path.join(BOT_REPORT_FOLDER, "github-report.md"),
        githubBody,
        "utf-8"
      ),
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
        path.join(BOT_REPORT_FOLDER, "app.json"),
        makeAppJSON(allAccountsAfter),
        "utf-8"
      ),
      fs.promises.writeFile(
        path.join(BOT_REPORT_FOLDER, "coin-apps.json"),
        JSON.stringify(allAppPaths),
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
