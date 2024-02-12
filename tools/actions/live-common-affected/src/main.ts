import { exec } from "child_process";
import * as core from "@actions/core";

/**
 * NB: the goal of live-common-affected is to return the main "logical" folders
 * that are affected by code changes in order to re-run integration tests for them.
 * This is somehow specific to how live-common works, notably we need to stop at the coin family folder level.
 */

function main(ref: string) {
  const cmd = `git diff --name-only ${ref}...HEAD`;

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
              const m = line.match(/live-common\/src\/([^/]+)\/([^/]+)/);
              if (m) {
                const [, first, second] = m;
                if (first === "families") {
                  // in case of coin implementations, we will stop at the coin family level
                  return `${first}/${second}`;
                } else {
                  // in any other case, we consider the first src/* folder level to be relevant filter
                  return first;
                }
              }
            })
            .filter(Boolean),
        ),
      ];
      core.setOutput("is-affected", String(list.length > 0));
      core.setOutput("paths", list.join(" "));
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
