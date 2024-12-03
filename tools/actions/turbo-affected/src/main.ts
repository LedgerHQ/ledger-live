import { execSync } from "child_process";
import * as core from "@actions/core";
import packageJson from "../../../../package.json";

async function main() {
  const head_ref = core.getInput("head_ref");
  const base_ref = core.getInput("base_ref");
  const pkg = core.getInput("package") || "";
  const command = core.getInput("command");
  const turboVersion = packageJson.devDependencies.turbo;
  const packageManager = packageJson.packageManager; // pnpm@<version_specified_in_package.json>

  try {
    const commits_cmd = `git log --oneline -n 10`;
    const commitsOutput = execSync(commits_cmd, {
      encoding: "utf-8",
      maxBuffer: 2048 * 1024,
    });
    console.log(commitsOutput);
    const separator = "----------------------";
    console.log(separator);
    // const head_commits_cmd = `git log ${head_ref} --oneline -n 10`;
    // const headCommitsOutput = execSync(head_commits_cmd, {
    //   encoding: "utf-8",
    //   maxBuffer: 2048 * 1024,
    // });
    // console.log(headCommitsOutput);
    // console.log(separator)
    const base_commits_cmd = `git log ${base_ref} --oneline -n 10`;
    const baseCommitsOutput = execSync(base_commits_cmd, {
      encoding: "utf-8",
      maxBuffer: 2048 * 1024,
    });
    console.log(baseCommitsOutput);
    const cmd = `npx turbo@${turboVersion} run ${command} --filter=[${head_ref}...${base_ref}] --dry=json`;
    console.log(`Running command: ${cmd}`);
    const turboOutput = execSync(cmd, {
      encoding: "utf-8",
      maxBuffer: 2048 * 1024,
    });
    const pnpmOutput = execSync(`npx ${packageManager} list -r --depth=-1 --json`, {
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
      core.setOutput("packages", JSON.stringify(Object.keys(affectedPackages)));
      core.setOutput(
        "paths",
        JSON.stringify(Object.keys(affectedPackages || {}).map(p => affectedPackages[p].path)),
      );
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
      core.setOutput("paths", []);
      core.setOutput("packages", []);
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
