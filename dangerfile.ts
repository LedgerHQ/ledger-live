// import { message, danger, warn, fail, markdown, schedule, peril, results } from "danger";
import { message, fail, markdown, danger } from "danger";
// @ts-expect-error danger seems to have an issue with node modules
import * as fs from "fs";
// @ts-expect-error danger seems to have an issue with node modules
import * as path from "path";

// HELPERS
const bytesToMb = bytes => bytes / 1024 / 1024;
const toFirstDecimal = value => Math.round(value * 10) / 10;

// DANGER METHODS
const lintResult = (project, basePath) => {
  const p = path.join(basePath, "lint-results.json");
  const exists = fs.existsSync(p);
  if (!exists) {
    message(`Could not find lint informations for ${project}`);
    return;
  }
  const lintFile = fs.readFileSync(p, "utf8");
  const json = JSON.parse(lintFile);
  const lintResult = json.reduce(
    (acc, line) => {
      if (line.errorCount > 0) {
        acc.errors += line.errorCount;
        acc.lines.push(line);
      }

      return acc;
    },
    { errors: 0, lines: [] },
  );

  if (lintResult.errors > 0) {
    fail(`Linting ${project} has failed`);
    let msg = `
## Lint ${project}

| file | line | column | message |
| ---- | ---- | ------ | ------- |
`;

    for (const line of lintResult.lines) {
      const file = line.filePath.split("ledger-live/")[1];
      for (const m of line.messages)
        msg += `| ${file} | ${m.line}-${m.endLine} | ${m.column} | ${m.message} |
`;
    }
    markdown(msg);
  } else {
    message(`Linting ${project} success !`);
  }
};

/**
 * DESKTOP DANGER SETUP
 */

// @ts-expect-error __dirname not defined
const baseDesktopPath = path.join(__dirname, "apps", "ledger-live-desktop");

const bundleSize = () => {
  const exists = fs.existsSync(path.join(baseDesktopPath, "metafile.main.json"));
  if (!exists) return;

  const mainFile = fs.readFileSync(path.join(baseDesktopPath, "metafile.main.json"), "utf8");
  const { outputs: mainOutputs } = JSON.parse(mainFile);

  const rendererFile = fs.readFileSync(
    path.join(baseDesktopPath, "metafile.renderer.json"),
    "utf8",
  );
  const { outputs: rendererOutputs } = JSON.parse(rendererFile);

  const mainSize = mainOutputs[".webpack/main.bundle.js"].bytes;
  const rendererSize = rendererOutputs[".webpack/renderer.bundle.js"].bytes;

  let message = `
## Bundle Sizes

| name | size (on this PR) | size (on develop) |
| ---- | ----------------- | ----------------- |
`;

  message += `| main | ~${toFirstDecimal(bytesToMb(mainSize))}mb | ${mainSize} |
`;

  message += `| renderer | ~${toFirstDecimal(bytesToMb(rendererSize))}mb | ${rendererSize} |`;

  markdown(message);
  fail("Desktop renderer bundle size is too big");
};

const desktopDanger = () => {
  lintResult("Ledger Live Desktop", baseDesktopPath);
  bundleSize();
};

const main = () => {
  console.log(danger.git.modified_files);
  desktopDanger();
};

main();

// danger.github.utils.createUpdatedIssueWithID(danger.github.thisPR.number, "", {});
// const modifiedMD = danger.git.modified_files.join("- ");
// // console.log(modifiedMD);
// message("Changed Files in this PR: \n - " + modifiedMD);
// warn("Let's test this");
