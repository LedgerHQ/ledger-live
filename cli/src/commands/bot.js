/* eslint-disable no-console */
// @flow
import { generateMnemonic } from "bip39";
import { from } from "rxjs";
import { getEnv } from "@ledgerhq/live-common/lib/env";
import { runWithAppSpec } from "@ledgerhq/live-common/lib/bot/engine";
import { formatReportForConsole } from "@ledgerhq/live-common/lib/bot/formatters";
import allSpecs from "@ledgerhq/live-common/lib/generated/specs";
import network from "@ledgerhq/live-common/lib/network";
import { findCryptoCurrencyByKeyword } from "@ledgerhq/live-common/lib/currencies";
import { currencyOpt } from "../scan";

export default {
  description:
    "Run a bot test engine with speculos that automatically create accounts and do transactions",
  args: [
    currencyOpt,
    {
      name: "mutation",
      alias: "m",
      type: String,
      desc: "filter the mutation to run by a regexp pattern",
    },
  ],
  job: ({
    currency,
    mutation,
  }: $Shape<{ currency: string, mutation: string }>) => {
    // TODO have a way to filter a spec by name / family
    async function test() {
      const SEED = getEnv("SEED");

      if (!SEED) {
        console.log(
          "You didn't define SEED yet. Please use a new one SPECIFICALLY to this test and with NOT TOO MUCH funds. USE THIS BOT TO YOUR OWN RISK!\n" +
            "here is a possible software seed you can use:\n" +
            "SEED='" +
            generateMnemonic(256) +
            "'"
        );
        throw new Error("Please define a SEED env variable to run this bot.");
      }

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

      const results = specs.map((spec) => {
        const logs = [];
        specsLogs.push(logs);
        return runWithAppSpec(spec, (log) => {
          console.log(log);
          logs.push(log);
        }).catch((error) => {
          specFatals.push({ spec, error });
          console.error(error);
          logs.push(`FATAL:\n${"```"}\n${String(error)}\n${"```"}\n`);
          return [];
        });
      });
      const combinedResults = await Promise.all(results);
      const combinedResultsFlat = combinedResults.flat();

      const errorCases = combinedResultsFlat.filter((r) => r.error);

      const botHaveFailed = specFatals.length > 0 || errorCases.length > 0;

      if (specFatals.length) {
        console.error(`================== SPEC ERRORS =====================\n`);
        specFatals.forEach((c) => {
          console.error(c.error);
          console.error("");
        });
      }

      if (errorCases.length) {
        console.error(
          `================== MUTATION ERRORS =====================\n`
        );
        errorCases.forEach((c) => {
          console.error(formatReportForConsole(c));
          console.error(c.error);
          console.error("");
        });
        console.error(
          `/!\\ ${errorCases.length} failures out of ${combinedResultsFlat.length} mutations. Check above!\n`
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
          body += `## 🤖👏 ${combinedResultsFlat.length} mutations succeed!`;
        }
        body += "\n\n";

        specFatals.forEach(({ spec, error }) => {
          body += `**Spec '${spec.name}' failed:**\n`;
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
        body += `<summary>Details of the ${combinedResultsFlat.length} mutations</summary>\n\n`;
        combinedResults.forEach((specResults, i) => {
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
        process.exit(1);
      }
    }

    return from(test());
  },
};
