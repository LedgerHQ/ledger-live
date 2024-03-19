/* eslint-disable no-console */
import fs from "fs";
import path from "path";
import { BigNumber } from "bignumber.js";
import uniq from "lodash/uniq";
import groupBy from "lodash/groupBy";
import { log } from "@ledgerhq/logs";
import invariant from "invariant";
import flatMap from "lodash/flatMap";
import { getEnv } from "@ledgerhq/live-env";
import allSpecs from "../generated/specs";
import type {
  AppSpec,
  MutationReport,
  MinimalSerializedMutationReport,
  MinimalSerializedReport,
  MinimalSerializedSpecReport,
  SpecReport,
} from "./types";
import { promiseAllBatched } from "../promise";
import { isCurrencySupported, formatCurrencyUnit, getFiatCurrencyByTicker } from "../currencies";
import { formatAccount, isAccountEmpty, toAccountRaw } from "../account";
import { runWithAppSpec } from "./engine";
import { formatReportForConsole, formatError, formatTime } from "./formatters";
import {
  initialState,
  loadCountervalues,
  inferTrackingPairForAccounts,
} from "@ledgerhq/live-countervalues/logic";
import { getPortfolio } from "../portfolio/v2";
import { Account } from "@ledgerhq/types-live";
import { getContext } from "@ledgerhq/coin-framework/bot/bot-test-context";
import { Transaction } from "../generated/types";
import { sha256 } from "../crypto";

type Arg = Partial<{
  filter: Partial<{ currencies: string[]; families: string[]; mutation: string }>;
  disabled: Partial<{ currencies: string[]; families: string[] }>;
}>;
const usd = getFiatCurrencyByTicker("USD");

function convertMutation<T extends Transaction>(
  report: MutationReport<T>,
): MinimalSerializedMutationReport {
  const { appCandidate, mutation, account, destination, error, operation } = report;
  return {
    appCandidate,
    mutationName: mutation?.name,
    accountId: account?.id,
    destinationId: destination?.id,
    operationId: operation?.id,
    error: error ? formatError(error) : undefined,
  };
}

function convertSpecReport<T extends Transaction>(
  result: SpecReport<T>,
): MinimalSerializedSpecReport {
  const accounts = result.accountsAfter?.map(a => {
    // remove the "expensive" data fields
    const raw = toAccountRaw(a);
    raw.operations = [];
    delete raw.balanceHistoryCache;
    if (raw.subAccounts) {
      raw.subAccounts.forEach(a => {
        a.operations = [];
        delete a.balanceHistoryCache;
      });
    }
    const unsafe = raw as any;
    if (unsafe.bitcoinResources) {
      delete unsafe.bitcoinResources.walletAccount;
    }
    return raw;
  });
  const mutations = result.mutations?.map(convertMutation);
  return {
    specName: result.spec.name,
    fatalError: result.fatalError ? formatError(result.fatalError) : undefined,
    accounts,
    mutations,
    existingMutationNames: result.spec.mutations.map(m => m.name),
    hintWarnings: result.hintWarnings,
  };
}

function makeAppJSON(accounts: Account[]) {
  const jsondata = {
    data: {
      settings: {
        hasCompletedOnboarding: true,
      },
      accounts: accounts.map(account => ({
        data: toAccountRaw(account),
        version: 1,
      })),
    },
  };
  return JSON.stringify(jsondata);
}

export function getSpecs({ disabled, filter }) {
  const specs: any[] = [];
  const filteredCurrencies = filter?.currencies || [];
  const filteredFamilies = filter?.families || [];
  const filteredMutation = filter?.mutation;
  let disabledCurrencies = disabled?.currencies || [];
  let disabledFamilies = disabled?.families || [];

  if (filteredFamilies.length > 0) {
    // We want to ignore disabled families when user filters on a family
    disabledFamilies = [];
  }

  if (filteredCurrencies.length > 0) {
    // We want to ignore disabled currencies when user filters on a currency
    disabledCurrencies = [];
  }

  for (const family in allSpecs) {
    if (filteredFamilies.length > 0 && !filteredFamilies.includes(family)) {
      // We only want to test specific families when we use a filter
      continue;
    }

    if (disabledFamilies.includes(family)) {
      // We don't want to test disabled families
      continue;
    }

    const familySpecs = allSpecs[family];

    for (const key in familySpecs) {
      let spec: AppSpec<any> = familySpecs[key];
      if (filteredCurrencies.length > 0 && !filteredCurrencies.includes(spec.currency.id)) {
        // We only want to test specific currencies when we use a filter
        continue;
      }

      if (disabledCurrencies.includes(spec.currency.id)) {
        // We don't want to test disabled currencies
        continue;
      }

      if (!isCurrencySupported(spec.currency) || spec.disabled) {
        // We do not want to add the spec if currency isn't supported or is disabled
        continue;
      }

      if (filteredMutation) {
        spec = {
          ...spec,
          mutations: spec.mutations.filter(m => new RegExp(filteredMutation).test(m.name)),
        };
      }

      specs.push(spec);
    }
  }
  return specs;
}

export async function bot({ disabled, filter }: Arg = {}): Promise<void> {
  const SEED = getEnv("SEED");
  invariant(SEED, "SEED required");
  const specsLogs: string[][] = [];

  const specs = getSpecs({ disabled, filter });

  const timeBefore = Date.now();
  const results: Array<SpecReport<any>> = await promiseAllBatched(
    getEnv("BOT_MAX_CONCURRENT"),
    specs,
    (spec: AppSpec<any>) => {
      const logs: string[] = [];
      specsLogs.push(logs);
      return runWithAppSpec(spec, message => {
        log("bot", message);
        if (process.env.CI) console.log(message);
        logs.push(message);
      }).catch(
        (fatalError): SpecReport<any> => ({
          spec,
          fatalError,
          mutations: [],
          accountsBefore: [],
          accountsAfter: [],
          hintWarnings: [],
          skipMutationsTimeoutReached: false,
        }),
      );
    },
  );
  const totalDuration = Date.now() - timeBefore;
  const allAppPaths = uniq(results.map(r => r.appPath || "").sort());
  const allAccountsAfter = flatMap(results, r => r.accountsAfter || []);
  let countervaluesError;
  const countervaluesState = await loadCountervalues(initialState, {
    trackingPairs: inferTrackingPairForAccounts(allAccountsAfter, usd),
    autofillGaps: true,
  }).catch(e => {
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
        new BigNumber(portfolio.balanceHistory[portfolio.balanceHistory.length - 1].value),
        {
          showCode: true,
        },
      )
    : "";
  const allMutationReports = flatMap(results, r => r.mutations || []);
  const mutationReports = allMutationReports.filter(r => r.mutation || r.error);
  const errorCases = allMutationReports.filter(r => r.error);
  const specFatals = results.filter(r => r.fatalError);
  const botHaveFailed = specFatals.length > 0 || errorCases.length > 0;
  const specsWithUncoveredMutations = results
    .map(r => ({
      spec: r.spec,
      unavailableMutations: r.spec.mutations
        .map(mutation => {
          if (r.mutations && r.mutations.some(mr => mr.mutation === mutation)) {
            return;
          }

          const errors = (r.mutations || [])
            .map(mr =>
              !mr.mutation && mr.unavailableMutationReasons
                ? mr.unavailableMutationReasons.find(r => r.mutation === mutation)
                : null,
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
    .filter(r => r.unavailableMutations.length > 0);
  const uncoveredMutations = flatMap(specsWithUncoveredMutations, s => s.unavailableMutations);

  if (specFatals.length && process.env.CI) {
    console.error(`================== SPEC ERRORS =====================\n`);
    specFatals.forEach(c => {
      console.error(c.fatalError);
      console.error("");
    });
  }

  if (errorCases.length && process.env.CI) {
    console.error(`================== MUTATION ERRORS =====================\n`);
    errorCases.forEach(c => {
      console.error(formatReportForConsole(c));
      console.error(c.error);
      console.error("");
    });
    console.error(
      `/!\\ ${errorCases.length} failures out of ${mutationReports.length} mutations. Check above!\n`,
    );
  }

  const specsWithoutFunds = results.filter(
    s =>
      !s.fatalError &&
      ((s.accountsBefore && s.accountsBefore.every(isAccountEmpty)) ||
        (s.mutations && s.mutations.every(r => !r.mutation))),
  );

  const fullySuccessfulSpecs = results.filter(
    s =>
      !s.fatalError &&
      s.mutations &&
      !specsWithoutFunds.includes(s) &&
      s.mutations.every(r => !r.mutation || r.operation),
  );

  const specsWithErrors = results.filter(
    s =>
      !s.fatalError &&
      s.mutations &&
      !specsWithoutFunds.includes(s) &&
      s.mutations.some(r => r.error || (r.mutation && !r.operation)),
  );

  const specsWithoutOperations = results.filter(
    s =>
      !s.fatalError &&
      !specsWithoutFunds.includes(s) &&
      !specsWithErrors.includes(s) &&
      s.mutations &&
      s.mutations.every(r => !r.operation),
  );

  const withoutFunds = specsWithoutFunds
    .filter(
      s =>
        // ignore coin that are backed by testnet that have funds
        !results.some(
          o =>
            o.spec.currency.isTestnetFor === s.spec.currency.id && !specsWithoutFunds.includes(o),
        ),
    )
    .map(s => s.spec.name);

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
  const runURL = `https://github.com/LedgerHQ/ledger-live/actions/runs/${String(GITHUB_RUN_ID)}`;
  const success = mutationReports.length - errorCases.length;

  if (success > 0) {
    title += `✅ ${success} txs `;
  }

  if (errorCases.length) {
    title += `❌ ${errorCases.length} txs `;
  }

  if (withoutFunds.length) {
    const msg = `💰 ${withoutFunds.length} miss funds `;
    title += msg;
  }

  if (countervaluesError) {
    title += `❌ countervalues `;
  } else {
    title += `(${totalUSD}) `;
  }

  title += `⏲ ${formatTime(totalDuration)} `;

  let subtitle = "";

  if (countervaluesError) {
    subtitle += `> ${formatError(countervaluesError)}`;
  }

  let slackBody = "";

  appendBody(`## `);
  if (GITHUB_RUN_ID && GITHUB_WORKFLOW) {
    appendBody(`[**${GITHUB_WORKFLOW}**](${runURL}) `);
  }
  appendBody(`${title}\n\n`);

  appendBody("\n\n");
  appendBody(subtitle);

  if (fullySuccessfulSpecs.length) {
    const msg = `> ✅ ${fullySuccessfulSpecs.length} specs are successful: _${fullySuccessfulSpecs
      .map(o => o.spec.name)
      .join(", ")}_\n`;
    appendBody(msg);
  }

  // slack unified message
  const slackUnified = uniq(specFatals.concat(specsWithErrors).concat(specsWithoutOperations));
  if (slackUnified.length) {
    const msg = `> ❌ ${slackUnified.length} specs have problems: _${slackUnified
      .map(o => o.spec.name)
      .join(", ")}_\n`;
    slackBody += msg;
  }

  // PR report detailed
  if (specsWithErrors.length) {
    const msg = `> ❌ ${specsWithErrors.length} specs have problems: _${specsWithErrors
      .map(o => o.spec.name)
      .join(", ")}_\n`;
    appendBody(msg);
  }

  if (withoutFunds.length) {
    const missingFundsWarn = `> 💰 ${
      withoutFunds.length
    } specs may miss funds: _${withoutFunds.join(", ")}_\n`;
    appendBody(missingFundsWarn);
  }

  if (specsWithoutOperations.length) {
    const warn = `> ⚠️ ${
      specsWithoutOperations.length
    } specs may have issues: *${specsWithoutOperations.map(o => o.spec.name).join(", ")}*\n`;
    appendBody(warn);
  }

  appendBody(
    "\n> What is the bot and how does it work? [Everything is documented here!](https://github.com/LedgerHQ/ledger-live/wiki/LLC:bot)\n\n",
  );

  appendBody("\n\n");

  if (specFatals.length) {
    appendBody("<details>\n");
    appendBody(`<summary>${specFatals.length} critical spec errors</summary>\n\n`);
    specFatals.forEach(({ spec, fatalError }) => {
      appendBody(`**Spec ${spec.name} failed!**\n`);
      appendBody("```\n" + formatError(fatalError, true) + "\n```\n\n");
    });
    appendBody("</details>\n\n");
  }

  // summarize the error causes
  const dedupedErrorCauses: string[] = [];
  errorCases.forEach(m => {
    if (!m.error) return;
    const ctx = getContext(m.error);
    if (!ctx) return;
    const cause = m.spec.name + " > " + ctx;
    if (!dedupedErrorCauses.includes(cause)) {
      dedupedErrorCauses.push(cause);
    }
  });

  if (errorCases.length) {
    appendBody("<details>\n");
    appendBody(`<summary>❌ ${errorCases.length} mutation errors</summary>\n\n`);
    errorCases.forEach(c => {
      appendBody("```\n" + formatReportForConsole(c) + "\n```\n\n");
    });
    appendBody("</details>\n\n");
  }

  const specWithWarnings = results.filter(s => s.hintWarnings.length > 0);
  if (specWithWarnings.length > 0) {
    appendBody("<details>\n");
    appendBody(
      `<summary>⚠️ ${specWithWarnings.reduce(
        (sum, s) => s.hintWarnings.length + sum,
        0,
      )} spec hints</summary>\n\n`,
    );
    specWithWarnings.forEach(s => {
      appendBody(`- Spec ${s.spec.name}:\n`);
      s.hintWarnings.forEach(txt => appendBody(`  - ${txt}\n`));
    });
    appendBody("</details>\n\n");
  }

  appendBodyFullOnly("<details>\n");

  appendBodyFullOnly(`<summary>Details of the ${mutationReports.length} mutations</summary>\n\n`);
  results.forEach((r, i) => {
    const spec = specs[i];
    const logs = specsLogs[i];
    appendBodyFullOnly(`#### Spec ${spec.name} (${r.mutations ? r.mutations.length : "failed"})\n`);
    appendBodyFullOnly("\n```\n");
    appendBodyFullOnly(logs.join("\n"));

    if (r.mutations) {
      r.mutations.forEach(m => {
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
      `<summary>Details of the ${uncoveredMutations.length} uncovered mutations</summary>\n\n`,
    );
    specsWithUncoveredMutations.forEach(({ spec, unavailableMutations }) => {
      appendBodyFullOnly(`#### Spec ${spec.name} (${unavailableMutations.length})\n`);
      unavailableMutations.forEach(m => {
        // FIXME: we definitely got to stop using Maybe types or | undefined | null
        if (!m) return;
        const msgs = groupBy(m.errors.map(e => e.message));
        appendBodyFullOnly(
          "- **" +
            m.mutation.name +
            "**: " +
            Object.keys(msgs)
              .map(msg => `${msg} (${msgs[msg].length})`)
              .join(", ") +
            "\n",
        );
      });
    });
    appendBodyFullOnly("</details>\n\n");
  }

  appendBody("<details>\n");
  appendBody(
    `<summary>Portfolio ${totalUSD ? " (" + totalUSD + ")" : ""} – Details of the ${
      results.length
    } currencies</summary>\n\n`,
  );
  appendBody("| Spec (accounts) | State | Remaining Runs (est) | funds? |\n");
  appendBody("|-----------------|-------|----------------------|--------|\n");
  results.forEach(r => {
    function sumAccounts(all) {
      if (!all || all.length === 0) return;
      return all.reduce((sum, a) => sum.plus(a.spendableBalance), new BigNumber(0));
    }

    const { accountsBefore } = r;

    const accountsBeforeBalance = sumAccounts(accountsBefore);
    let balance = !accountsBeforeBalance
      ? "🤷‍♂️"
      : "**" +
        formatCurrencyUnit(r.spec.currency.units[0], accountsBeforeBalance, {
          showCode: true,
        }) +
        "**";

    let eta = 0;
    let etaEmoji = "❌";
    const accounts = r.accountsAfter || r.accountsBefore || [];
    const operations = flatMap(accounts, a => a.operations).sort((a, b) =>
      a.fee.minus(b.fee).toNumber(),
    );
    const avgOperationFee = operations
      .reduce((sum, o) => sum.plus(o.fee || 0), new BigNumber(0))
      .div(operations.length);
    // const medianOperation = operations[Math.floor(operations.length / 2)];
    const maxRuns = r.spec.mutations.reduce((sum, m) => sum + m.maxRun || 1, 0);
    if (avgOperationFee.gt(0) && maxRuns > 0) {
      const spendableBalanceSum = accounts.reduce(
        (sum, a) =>
          sum.plus(BigNumber.max(a.spendableBalance.minus(r.spec.minViableAmount || 0), 0)),
        new BigNumber(0),
      );
      eta = spendableBalanceSum.div(avgOperationFee).div(maxRuns).toNumber();
      etaEmoji = eta < 50 ? "⚠️" : eta < 500 ? "👍" : "💪";
    }

    if (countervaluesState && r.accountsAfter) {
      const portfolio = getPortfolio(r.accountsAfter, period, countervaluesState, usd);
      const totalUSD = portfolio
        ? formatCurrencyUnit(
            usd.units[0],
            new BigNumber(portfolio.balanceHistory[portfolio.balanceHistory.length - 1].value),
            {
              showCode: true,
            },
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
    const firstAccount = accounts[0];
    appendBody(`| ${r.spec.name} (${accounts.length}) `);
    appendBody(
      `| ${afterOps || beforeOps} ops ${
        afterOps > beforeOps ? ` (+${afterOps - beforeOps})` : ""
      }, ${balance} `,
    );
    appendBody(`| ${etaEmoji} ${!eta ? "" : eta > 999 ? "999+" : Math.round(eta)} `);
    appendBody(`| \`${(firstAccount && firstAccount.freshAddress) || ""}\` `);
    appendBody("|\n");
  });

  appendBody("\n```\n");
  appendBody(allAccountsAfter.map(a => formatAccount(a, "head")).join("\n"));
  appendBody("\n```\n");

  appendBody("\n</details>\n\n");

  // Add performance details
  appendBody("<details>\n");
  appendBody(`<summary>Performance ⏲ ${formatTime(totalDuration)}</summary>\n\n`);
  appendBody("**Time spent for each spec:** (total across mutations)\n");

  function sumMutation(mutations, f) {
    return mutations?.reduce((sum, m) => sum + (f(m) || 0), 0) || 0;
  }
  function sumResults(f) {
    return results.reduce((sum, r) => sum + (f(r) || 0), 0);
  }
  function sumResultsMutation(f) {
    return sumResults(r => sumMutation(r.mutations, f));
  }

  appendBody(
    "| Spec (accounts) | preload | scan | re-sync | tx status | sign op | broadcast | test | destination test |\n",
  );
  appendBody("|---|---|---|---|---|---|---|---|---|\n");

  appendBody("| **TOTAL** |");
  appendBody(`**${formatTime(sumResults(r => r.preloadDuration))}** |`);
  appendBody(`**${formatTime(sumResults(r => r.scanDuration))}** |`);
  appendBody(`**${formatTime(sumResultsMutation(m => m.resyncAccountsDuration || 0))}** |`);
  appendBody(
    `**${formatTime(
      sumResultsMutation(m => (m.mutationTime && m.statusTime ? m.statusTime - m.mutationTime : 0)),
    )}** |`,
  );
  appendBody(
    `**${formatTime(
      sumResultsMutation(m => (m.statusTime && m.signedTime ? m.signedTime - m.statusTime : 0)),
    )}** |`,
  );
  appendBody(
    `**${formatTime(
      sumResultsMutation(m =>
        m.signedTime && m.broadcastedTime ? m.broadcastedTime - m.signedTime : 0,
      ),
    )}** |`,
  );
  appendBody(
    `**${formatTime(
      sumResultsMutation(m =>
        m.broadcastedTime && m.confirmedTime ? m.confirmedTime - m.broadcastedTime : 0,
      ),
    )}** |`,
  );
  appendBody(`**${formatTime(sumResultsMutation(m => m.testDestinationDuration || 0))}** |\n`);

  results.forEach(r => {
    const accounts = r.accountsAfter || r.accountsBefore || [];
    appendBody(`| ${r.spec.name} (${accounts.filter(a => a.used).length}) |`);
    appendBody(`${formatTime(r.preloadDuration || 0)} |`);
    appendBody(`${formatTime(r.scanDuration || 0)} |`);
    appendBody(`${formatTime(sumMutation(r.mutations, m => m.resyncAccountsDuration || 0))} |`);
    appendBody(
      `${formatTime(
        sumMutation(r.mutations, m =>
          m.mutationTime && m.statusTime ? m.statusTime - m.mutationTime : 0,
        ),
      )} |`,
    );
    appendBody(
      `${formatTime(
        sumMutation(r.mutations, m =>
          m.statusTime && m.signedTime ? m.signedTime - m.statusTime : 0,
        ),
      )} |`,
    );
    appendBody(
      `${formatTime(
        sumMutation(r.mutations, m =>
          m.signedTime && m.broadcastedTime ? m.broadcastedTime - m.signedTime : 0,
        ),
      )} |`,
    );
    appendBody(
      `${formatTime(
        sumMutation(r.mutations, m =>
          m.broadcastedTime && m.confirmedTime ? m.confirmedTime - m.broadcastedTime : 0,
        ),
      )} |`,
    );
    appendBody(`${formatTime(sumMutation(r.mutations, m => m.testDestinationDuration || 0))} |\n`);
  });

  appendBody("\n</details>\n\n");

  appendBody(
    "\n> What is the bot and how does it work? [Everything is documented here!](https://github.com/LedgerHQ/ledger-live/wiki/LLC:bot)\n\n",
  );

  const { BOT_REPORT_FOLDER, BOT_ENVIRONMENT } = process.env;

  let complementary = "";
  const { GITHUB_REF_NAME, GITHUB_ACTOR } = process.env;
  if (GITHUB_REF_NAME !== "develop") {
    complementary = `:pr: by *${GITHUB_ACTOR}* on \`${GITHUB_REF_NAME}\` `;
  }

  const slackCommentTemplate = `${String(
    GITHUB_WORKFLOW,
  )} ${complementary}(<{{url}}|details> – <${runURL}|logs>)\n${title}\n${slackBody}`;

  if (BOT_REPORT_FOLDER) {
    const serializedReport: MinimalSerializedReport = {
      results: results.map(convertSpecReport),
      environment: BOT_ENVIRONMENT,
      seedHash: sha256(getEnv("SEED")),
    };

    await Promise.all([
      fs.promises.writeFile(path.join(BOT_REPORT_FOLDER, "github-report.md"), githubBody, "utf-8"),
      fs.promises.writeFile(path.join(BOT_REPORT_FOLDER, "full-report.md"), body, "utf-8"),
      fs.promises.writeFile(
        path.join(BOT_REPORT_FOLDER, "slack-comment-template.md"),
        slackCommentTemplate,
        "utf-8",
      ),
      fs.promises.writeFile(
        path.join(BOT_REPORT_FOLDER, "app.json"),
        makeAppJSON(allAccountsAfter),
        "utf-8",
      ),
      fs.promises.writeFile(
        path.join(BOT_REPORT_FOLDER, "coin-apps.json"),
        JSON.stringify(allAppPaths),
        "utf-8",
      ),
      fs.promises.writeFile(
        path.join(BOT_REPORT_FOLDER, "report.json"),
        JSON.stringify(serializedReport),
        "utf-8",
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
