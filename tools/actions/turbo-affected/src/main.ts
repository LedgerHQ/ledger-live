import { execSync } from "child_process";
import * as core from "@actions/core";

async function main() {
  const ref = core.getInput("ref");
  const pkg = core.getInput("package") || "";
  const command = core.getInput("command");

  try {
    const turboOutput = execSync(
      `npx turbo@^1.10.1 run ${command} --filter=...[${ref}] --dry=json`,
      {
        encoding: "utf-8",
        maxBuffer: 2048 * 1024,
      },
    );
    const pnpmOutput = execSync(`npx pnpm list -r --depth=0 --json`, {
      encoding: "utf-8",
      maxBuffer: 2048 * 1024,
    });

    const turboAffected = JSON.parse(turboOutput);

    if (turboAffected === null) {
      core.error(`Failed to parse JSON output from "${turboOutput}"`);
      core.setFailed("parsed JSON is null");
      return;
    }

    const { packages } = turboAffected;
    if (packages.length) {
      const workspaceInfos = JSON.parse(pnpmOutput);

      const isPackageAffected = (packages as string[]).includes(pkg);
      const affectedPackages: Record<string, { path: string }> = {};
      workspaceInfos.forEach((pkg: Record<string, string>) => {
        if (packages.includes(pkg.name)) {
          affectedPackages[pkg.name] = {
            path: pkg.path.replace(process.cwd() + "/", ""),
          };
        }
      });
      const affected = JSON.stringify(affectedPackages);
      core.info(`Affected packages since ${ref} (${packages.length}):\n${affected}`);
      core.setOutput("affected", affected);
      core.setOutput("is-package-affected", isPackageAffected);
      core.summary.addHeading("Affected Packages");
      core.summary.addRaw(`There are ${packages.length} affected packages since ${ref}`);
      core.summary.addTable([
        [{ data: "name", header: true }],
        ...packages.map((p: string) => (p === pkg ? [`<strong>${p}</strong>`] : [p])),
      ]);
    } else {
      core.info(`No packages affected since ${ref}`);
      core.setOutput("affected", JSON.stringify({}));
      core.setOutput("is-package-affected", false);
      core.summary.addHeading("Affected Packages");
      core.summary.addRaw(`No affected packages since ${ref}`);
    }
    core.summary.write();
  } catch (error) {
    core.error(`${error}`);
    core.setFailed(error as Error);
    return;
  }
}

main().catch(err => {
  core.setFailed(err);
});
