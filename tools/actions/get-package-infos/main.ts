import * as core from "@actions/core";
import * as semver from "semver";
import * as fs from "fs";

const main = async (): Promise<void> => {
  const packageName: string = core.getInput("package");
  const path: string = core.getInput("path");
  const json = fs.readFileSync(`${path}/${packageName}`, "utf8");
  const pkg = JSON.parse(json);

  const { version } = semver.coerce(pkg.version);
  const prerelease = semver.prerelease(pkg.version);

  core.setOutput("version", pkg.version);
  core.info(`version ${pkg.version}`);
  core.setOutput("clean", version);
  core.info(`clean ${version}`);
  core.setOutput("name", pkg.name);
  core.info(`name ${pkg.name}`);
  if (prerelease) {
    core.setOutput(`prerelease`, true);
    core.info(`prerelease detected`);
    core.setOutput(`channel`, prerelease[0]);
    core.info(`prerelease type ${prerelease[0]}`);
  } else {
    core.setOutput(`prerelease`, false);
    core.info(`no prerelease detected`);
    core.setOutput(`channel`, null);
  }
};

main().catch((err) => core.setFailed(err.message));
