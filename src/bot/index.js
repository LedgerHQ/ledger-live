/* eslint-disable no-console */
// @flow
import { BigNumber } from "bignumber.js";
import { log } from "@ledgerhq/logs";
import invariant from "invariant";
import flatMap from "lodash/flatMap";
import { getEnv } from "../env";
import allSpecs from "../generated/specs";
import network from "../network";
import type { MutationReport } from "./types";
import { promiseAllBatched } from "../promise";
import {
  findCryptoCurrencyByKeyword,
  isCurrencySupported,
  formatCurrencyUnit,
} from "../currencies";
import { isAccountEmpty } from "../account";
import { runWithAppSpec } from "./engine";
import { formatReportForConsole } from "./formatters";

type Arg = $Shape<{
  currency: string,
  mutation: string,
}>;

export async function bot({ currency, mutation }: Arg = {}) {
  const SEED = getEnv("SEED");
  invariant(SEED, "SEED required");

  const specs = [];
  const specsLogs = [];

  const maybeCurrency = currency
    ? findCryptoCurrencyByKeyword(currency)
    : undefined;

  for (const family in allSpecs) {
    const familySpecs = allSpecs[family];
    for (const key in familySpecs) {
      let spec = familySpecs[key];
      if (!isCurrencySupported(spec.currency)) {
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

  const results = await promiseAllBatched(4, specs, (spec) => {
    const logs = [];
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
  });
  const mutationReports = flatMap(results, (r) => r.mutations || []);

  const errorCases = mutationReports.filter((r) => r.error);

  const specFatals = results.filter((r) => r.fatalError);

  const botHaveFailed = specFatals.length > 0 || errorCases.length > 0;

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

  const {
    GITHUB_SHA,
    GITHUB_TOKEN,
    GITHUB_RUN_ID,
    GITHUB_WORKFLOW,
  } = process.env;
  if (GITHUB_TOKEN && GITHUB_SHA) {
    log("github", "will send a report to " + GITHUB_SHA);
    let body = "";
    let title = "";
    const runURL = `https://github.com/LedgerHQ/ledger-live-common/actions/runs/${String(
      GITHUB_RUN_ID
    )}`;

    if (errorCases.length) {
      title = `❌ ${errorCases.length} mutations failed (out of ${mutationReports.length})`;
    } else {
      title = `${specFatals.length ? "❌" : "👏"} ${
        mutationReports.length
      } mutations succeed`;
    }
    if (specFatals.length) {
      title += ` ⚠️ ${specFatals.length} specs failed`;
    }

    body += `## ${title}`;

    if (GITHUB_RUN_ID && GITHUB_WORKFLOW) {
      body += ` for [**${GITHUB_WORKFLOW}**](${runURL})\n\n`;
    }
    body += "\n\n";

    const withoutFunds = results
      .filter(
        (s) =>
          !s.fatalError &&
          ((s.accountsBefore && s.accountsBefore.every(isAccountEmpty)) ||
            (s.mutations && s.mutations.every((r) => !r.mutation)))
      )
      .map((s) => s.spec.name);

    if (specFatals.length) {
      body += "<details>\n";

      body += `<summary>${specFatals.length} critical spec errors</summary>\n\n`;

      specFatals.forEach(({ spec, fatalError }) => {
        body += `**Spec ${spec.name} failed!**\n`;
        body += "```\n" + String(fatalError) + "\n```\n\n";
      });

      body += "</details>\n";
    }

    if (errorCases.length) {
      body += "<details>\n";

      body += `<summary>${errorCases.length} critical mutation errors</summary>\n\n`;

      errorCases.forEach((c) => {
        body +=
          "```\n" +
          formatReportForConsole(c) +
          "\n" +
          String(c.error) +
          "\n```\n\n";
      });

      body += "</details>\n";
    }

    body += "<details>\n";
    body += `<summary>Details of the ${mutationReports.length} mutations</summary>\n\n`;
    results.forEach((r, i) => {
      const spec = specs[i];
      const logs = specsLogs[i];
      body += `### Spec ${spec.name} (${
        r.mutations ? r.mutations.length : "failed"
      } mutations)\n`;
      body += "\n```\n";
      body += logs.join("\n");
      body += "\n```\n";
    });
    body += "</details>\n";

    body += "### Portfolio\n\n";

    if (withoutFunds.length) {
      body += `**⚠️ ${
        withoutFunds.length
      } specs don't have enough funds!** (${withoutFunds.join(", ")})\n\n`;
    }

    body += "<details>\n";
    body += `<summary>Details of the ${results.length} currencies</summary>\n\n`;
    body +=
      "| Spec (accounts) | Operations | Balance | remaining | Receive |\n";
    body +=
      "|------|----------|------------|--------------|-------------|---------|\n";
    results.forEach((r) => {
      function sumAccounts(all) {
        if (!all || all.lengnth === 0) return;
        return all.reduce(
          (sum, a) => sum.plus(a.spendableBalance),
          BigNumber(0)
        );
      }
      const accountsBeforeBalance = sumAccounts(r.accountsBefore);
      const accountsAfterBalance = sumAccounts(r.accountsAfter);

      let balance = !accountsBeforeBalance
        ? "???"
        : formatCurrencyUnit(r.spec.currency.units[0], accountsBeforeBalance, {
            showCode: true,
          });

      let etaTxs = "???";
      if (
        accountsBeforeBalance &&
        accountsAfterBalance &&
        accountsAfterBalance.lt(accountsBeforeBalance)
      ) {
        const txCount = r.mutations
          ? r.mutations.filter((m) => m.operation).length
          : 0;
        const d = accountsAfterBalance.minus(accountsBeforeBalance);
        balance +=
          "(- " + formatCurrencyUnit(r.spec.currency.units[0], d) + ")";
        etaTxs = `~${accountsAfterBalance
          .div(d.div(txCount))
          .integerValue()
          .toString()} txs`;
      }

      function countOps(all) {
        if (!all) return 0;
        return all.reduce((sum, a) => sum + a.operations.length, 0);
      }
      const beforeOps = countOps(r.accountsBefore);
      const afterOps = countOps(r.accountsAfter);
      const firstAccount = (r.accountsAfter || r.accountsBefore || [])[0];

      body += `| ${r.spec.name} (${
        (r.accountsBefore || []).filter((a) => !isAccountEmpty(a)).length
      }) `;
      body += `| ${afterOps || beforeOps}${
        afterOps > beforeOps ? ` (+ ${afterOps - beforeOps})` : ""
      } `;
      body += `| ${balance} `;
      body += `| ${etaTxs} `;
      body += `| ${(firstAccount && firstAccount.freshAddress) || ""} `;
      body += "|\n";
    });

    body += "\n</details>\n\n";

    const { data: githubComment } = await network({
      url: `https://api.github.com/repos/LedgerHQ/ledger-live-common/commits/${GITHUB_SHA}/comments`,
      method: "POST",
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
      },
      data: { body },
    });

    const { SLACK_API_TOKEN } = process.env;
    if (SLACK_API_TOKEN && githubComment) {
      const text = `${String(GITHUB_WORKFLOW)}: ${title} (<${
        githubComment.html_url
      }|details> – <${runURL}|logs>)`;
      await network({
        url: "https://slack.com/api/chat.postMessage",
        method: "POST",
        headers: {
          Authorization: `Bearer ${SLACK_API_TOKEN}`,
        },
        data: {
          text,
          channel: "ledger-live-bot",
        },
      });
    }
  } else {
    log(
      "github",
      "will NOT send a report. Missing " +
        [GITHUB_SHA ? "" : "commit", GITHUB_TOKEN ? "" : "token"]
          .filter(Boolean)
          .join(" ")
    );
  }

  if (botHaveFailed) {
    let txt = "";
    specFatals.forEach(({ spec, fatalError }) => {
      txt += `${spec.name} got ${String(fatalError)}\n`;
    });
    errorCases.forEach((c: MutationReport<*>) => {
      txt += `in ${c.spec.name}`;
      if (c.account) txt += `/${c.account.name}`;
      if (c.mutation) txt += `/${c.mutation.name}`;
      txt += ` got ${String(c.error)}\n`;
    });
    throw new Error(txt);
  }
}
