import * as core from "@actions/core";
import * as semver from "semver";
import * as fs from "fs";

const main = async (): Promise<void> => {
  const packageName: string = core.getInput("package");
  const path: string = core.getInput("path");
  const json = fs.readFileSync(`${path}/${packageName}`, "utf8");
  const pkg = JSON.parse(json);

  const { version } = semver.coerce(pkg.version);

  core.setOutput("version", pkg.version);
  core.info(`version ${pkg.version}`);
  core.setOutput("clean", version);
  core.info(`clean ${version}`);
  core.setOutput("name", pkg.name);
  core.info(`name ${pkg.name}`);
};

main().catch((err) => core.setFailed(err.message));
