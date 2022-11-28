import { exec } from "child_process";
import * as core from "@actions/core";

async function main() {
  const ref = core.getInput("head-ref");
  const pkg = core.getInput("package") || "";
  const command = core.getInput("command");

  const cmd = `npx turbo run ${command} --filter=...[${ref}] --dry=json`;

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

      try {
        const parsed = JSON.parse(stdout);
        if (parsed === null) {
          core.error(`Failed to parse JSON output from "${cmd}"`);
          core.setFailed("parsed JSON is null");
          return;
        }

        const { packages } = parsed;
        if (packages.length) {
          const isPackageAffected = (packages as string[]).includes(pkg);
          const affected = JSON.stringify(packages);
          core.info(
            `Affected packages since ${ref} (${packages.length}):\n${affected}`
          );
          core.setOutput("affected", affected);
          core.setOutput("is-package-affected", isPackageAffected);
          core.summary.addHeading("Affected Packages");
          core.summary.addRaw(
            `There are ${packages.length} affected packages since ${ref}`
          );
          core.summary.addTable([
            [{ data: "name", header: true }],
            ...packages.map((p: string) =>
              p === pkg ? [`<strong>${p}</strong>`] : [p]
            ),
          ]);
        } else {
          core.info(`No packages affected since ${ref}`);
          core.setOutput("affected", JSON.stringify([]));
          core.setOutput("is-package-affected", false);
          core.summary.addHeading("Affected Packages");
          core.summary.addRaw(`No affected packages since ${ref}`);
        }
        core.summary.write();
      } catch (err) {
        core.error(`Failed to parse JSON output from "${cmd}"`);
        core.setFailed(err);
      }
    }
  );
}

main().catch((err) => {
  core.setFailed(err);
});
