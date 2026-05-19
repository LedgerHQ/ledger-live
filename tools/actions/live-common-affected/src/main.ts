import { exec } from "child_process";
import { GENERIC_COIN_SERVICE_CHAINS } from "./constants";
import * as core from "@actions/core";

/**
 * NB: the goal of live-common-affected is to return the main "logical" folders
 * that are affected by code changes in order to re-run integration tests for them.
 * This is somehow specific to how live-common works, notably we need to stop at the coin family folder level.
 */

function main(ref: string) {
  const cmd = `git diff --name-only ${ref}...HEAD`;
  const patterns = [
    "live-common\\/src\\/([^/]+)\\/([^/]+)", // live-common/src/<family>/<subfolder>
    "coin-modules\\/([^/]+)", // coin-modules/<coin>
    "coin-tester\\/([^/]+)", // coin-tester
    "coin-tester-modules\\/([^/]+)", // coin-tester-modules/<coin>
    "ledger-wallet-framework\\/([^/]+)",
  ];
  const coins = new Set<string>();

  const combinedRegex = new RegExp(patterns.join("|"));
  exec(
    cmd,
    {
      cwd: process.cwd(),
    },
    (error, stdout) => {
      if (error) {
        core.error(`${error}`);
        core.setFailed(error);
        return;
      }
      const list = [
        ...new Set(
          stdout
            .split("\n")
            .map(line => {
              const m = line.match(combinedRegex);
              if (m) {
                const [full, firstFolder, secondFolder] = m;
                if (full.startsWith("coin-modules/")) {
                  coins.add(full.replace(/^.*coin-/, ""));
                } else if (full.startsWith("live-common/src/families/")) {
                  coins.add(full.replace(/^live-common\/src\/families\//, ""));
                }
                if (firstFolder === "families") {
                  // in case of coin implementations, we will stop at the coin family level
                  return `${firstFolder}/${secondFolder}`;
                } else if (firstFolder === "bridge" && secondFolder === "generic-coin-framework") {
                  // in case of live-common/src, we consider the first src/* folder level to be relevant filter
                  return GENERIC_COIN_SERVICE_CHAINS;
                } else {
                  // in any other case, we consider the second src/* folder level to be relevant filter
                  return firstFolder || full;
                }
              }
            })
            .flat()
            .filter(Boolean),
        ),
      ];

      core.setOutput("is-affected", String(list.length > 0));
      core.setOutput("paths", list.join(" "));
      core.setOutput("coins", Array.from(coins).join(" "));
      if (list.length > 0) {
        core.info(`${list.length} paths affected since ${ref}: ${list.join(" ")}`);
      } else {
        core.info(`No paths affected since ${ref}`);
      }
      core.summary.write();
    },
  );
}

main(core.getInput("ref"));
