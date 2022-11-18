import { exec } from "child_process";
import uniq from "lodash/uniq";
import * as core from "@actions/core";

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
      const list = uniq(
        stdout
          .split("\n")
          .map((line) => {
            const m = line.match(/live-common\/src\/families\/([^/]+)/);
            if (m) return m[1];
          })
          .filter(Boolean)
      );
      core.setOutput("is-affected", String(list.length > 0));
      core.setOutput("families", list.join(" "));
      core.info(`No packages affected since ${ref}`);
      core.summary.write();
    }
  );
}

main(core.getInput("ref"));
