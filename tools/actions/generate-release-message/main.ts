import * as core from "@actions/core";
import { promises as fs } from "fs";
import * as path from "path";
import semver from "semver";

const getCleanVersion = (str) => {
  return str.replace("## ", "").trim();
};

const main = async () => {
  const changelogPath = core.getInput("changelog-path");
  const packagePath = core.getInput("package-path");
  const outputPath = core.getInput(" output-path");
  const name = core.getInput("name");

  const changelog = await fs.readFile(path.resolve(changelogPath), "utf8");

  const pkg = JSON.parse(await fs.readFile(path.resolve(packagePath), "utf8"));
  const parsed = semver.parse(pkg.version);
  const split = changelog.split("\n");

  let saved = ``;

  let currentVersion;
  for (const line of split) {
    const isVersionLine = line.startsWith("## ");
    const clean = getCleanVersion(line);
    if (isVersionLine) {
      currentVersion = clean;
      if (
        !semver.eq(clean, `${parsed.major}.${parsed.minor}.${parsed.patch}`)
      ) {
        currentVersion = null;
      } else {
        saved = `${line}`;
      }
    } else {
      if (currentVersion) {
        saved = `${saved}\n${line}`;
      }
    }
  }
  const p = path.join(outputPath, `${name}.md`);
  core.setOutput("path", p);
  await fs.writeFile(path.join(outputPath, `${name}.md`), saved, "utf8");
};

main().catch((err) => core.setFailed(err));
