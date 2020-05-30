/* eslint-disable no-console */
// @flow
import { log } from "@ledgerhq/logs";
import invariant from "invariant";
import flatMap from "lodash/flatMap";
import { getEnv } from "../env";
import allSpecs from "../generated/specs";
import network from "../network";
import type { MutationReport } from "./types";
import { promiseAllBatched } from "../promise";
import { findCryptoCurrencyByKeyword } from "../currencies";
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
  const specFatals = [];

  const maybeCurrency = currency
    ? findCryptoCurrencyByKeyword(currency)
    : undefined;

  for (const family in allSpecs) {
    const familySpecs = allSpecs[family];
    for (const key in familySpecs) {
      let spec = familySpecs[key];
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

  const results = await promiseAllBatched(10, specs, (spec) => {
    const logs = [];
    specsLogs.push(logs);
    return runWithAppSpec(spec, (message) => {
      log("bot", message);
      console.log(message);
      logs.push(message);
    }).catch((error) => {
      specFatals.push({ spec, error });
      log("bot-error", "FATAL spec " + spec.name + String(error));
      console.error("FATAL spec " + spec.name, error);
      logs.push(String(error));
      return [];
    });
  });
  const resultsFlat = flatMap(results, (r) => r);

  const errorCases = resultsFlat.filter((r) => r.error);

  const botHaveFailed = specFatals.length > 0 || errorCases.length > 0;

  if (specFatals.length) {
    console.error(`================== SPEC ERRORS =====================\n`);
    specFatals.forEach((c) => {
      console.error(c.error);
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
      `/!\\ ${errorCases.length} failures out of ${resultsFlat.length} mutations. Check above!\n`
    );
  }

  const { GITHUB_SHA, GITHUB_TOKEN } = process.env;
  if (GITHUB_TOKEN && GITHUB_SHA) {
    let body = "";
    if (errorCases.length) {
      body += `## 🤖❌ ${errorCases.length} mutations failed`;
    } else if (specFatals.length) {
      body += `## 🤖❌ ${specFatals.length} specs failed`;
    } else {
      body += `## 🤖👏 ${resultsFlat.length} mutations succeed!`;
    }
    body += "\n\n";

    const withoutResults = results
      .map((result, i) => ({
        resultWithMutations: result.filter((r) => !!r.mutation),
        spec: specs[i],
        isFatal: specFatals.find((f) => f.spec === specs[i]),
      }))
      .filter((s) => !s.isFatal && s.resultWithMutations.length === 0)
      .map((s) => s.spec.name);

    if (withoutResults.length) {
      body += `**⚠️ ${
        withoutResults.length
      } specs don't have enough funds!** (${withoutResults.join(", ")})\n\n`;
    }

    specFatals.forEach(({ spec, error }) => {
      body += `**Spec '${spec.name}' failed!**\n`;
      body += "```\n" + String(error) + "\n```\n\n";
    });

    errorCases.forEach((c) => {
      body +=
        "```\n" +
        formatReportForConsole(c) +
        "\n" +
        String(c.error) +
        "\n```\n\n";
    });

    body += "<details>\n";
    body += `<summary>Details of the ${resultsFlat.length} mutations</summary>\n\n`;
    results.forEach((specResults, i) => {
      const spec = specs[i];
      const logs = specsLogs[i];
      body += `### Spec '${spec.name}'\n`;
      body += "\n```\n";
      body += logs.join("\n");
      body += "\n```\n";
    });
    body += "</details>\n";

    await network({
      url: `https://api.github.com/repos/LedgerHQ/ledger-live-common/commits/${GITHUB_SHA}/comments`,
      method: "POST",
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
      },
      data: { body },
    });
  }

  if (botHaveFailed) {
    let txt = "";
    specFatals.forEach(({ spec, error }) => {
      txt += `${spec.name} got ${String(error.name)}\n`;
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
