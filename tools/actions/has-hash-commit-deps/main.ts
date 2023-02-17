import * as core from "@actions/core";
import { join } from "path";
import { promises as fs, existsSync } from "fs";

async function main() {
  const filePath = join(core.getInput("workspace") || "", "package.json");
  core.info(filePath);
  if (existsSync(filePath)) {
    try {
      const p = await fs.readFile(filePath, "utf8");
      core.info(p);
      if (!p) {
        core.setOutput("has-hash-commit-deps", false);
        return;
      }
      const json = JSON.parse(p);
      const { dependencies = {}, devDependencies = {} } = json;
      const versions = Object.keys(dependencies)
        .map((key) => dependencies[key])
        .concat(
          Object.keys(devDependencies).map((key) => devDependencies[key])
        );
      const has = versions.some((v) => v.includes(".git") || v.includes("#"));
      core.setOutput("has-hash-commit-deps", has);
      return;
    } catch (error) {
      core.info(error);
      throw error;
    }
  }
}

main().catch((err) => core.setFailed(err));
