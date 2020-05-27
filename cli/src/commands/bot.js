/* eslint-disable no-console */
// @flow
import { generateMnemonic } from "bip39";
import { from } from "rxjs";
import { getEnv } from "@ledgerhq/live-common/lib/env";
import { runWithAppSpec } from "@ledgerhq/live-common/lib/bot/engine";
import { formatReportForConsole } from "@ledgerhq/live-common/lib/bot/formatters";
import allSpecs from "@ledgerhq/live-common/lib/generated/specs";
import network from "@ledgerhq/live-common/lib/network";

export default {
  description:
    "Run a bot test engine with speculos that automatically create accounts and do transactions",
  args: [],
  job: () => {
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

      for (const family in allSpecs) {
        const familySpecs = allSpecs[family];
        for (const key in familySpecs) {
          specs.push(familySpecs[key]);
        }
      }

      const results = specs.map((spec) =>
        runWithAppSpec(spec, (log) => console.log(log))
      );
      const combinedResults = await Promise.all(results);

      const errorCases = combinedResults.flat().filter((r) => r.error);

      if (errorCases.length) {
        console.error(`================== ERRORS =====================\n`);
        errorCases.forEach((c) => {
          console.error(formatReportForConsole(c));
          console.error(c.error);
          console.error("");
        });
        console.error(
          `/!\\ ${errorCases.length} failures out of ${combinedResults.length} mutations. Check above!\n`
        );

        const { GITHUB_SHA, GITHUB_TOKEN } = process.env;
        if (GITHUB_TOKEN && GITHUB_SHA) {
          await network({
            url: `https://api.github.com/repos/LedgerHQ/ledger-live-common/commits/${GITHUB_SHA}/comments`,
            method: "POST",
            headers: {
              Authorization: `token ${GITHUB_TOKEN}`,
            },
            data: {
              body:
                "## 🤖 Oops\n\n" +
                `ledger-live bot reached ${errorCases.length} failures out of ${combinedResults.length} mutations:\n\n` +
                errorCases
                  .map(
                    (c) =>
                      "```\n" +
                      formatReportForConsole(c) +
                      "\n" +
                      String(c.error) +
                      "```\n"
                  )
                  .join("\n"),
            },
          });
        }

        process.exit(1);
      }
    }

    return from(test());
  },
};
