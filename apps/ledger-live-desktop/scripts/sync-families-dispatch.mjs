#!/usr/bin/env zx
import "zx/globals";
import rimraf from "rimraf";

const basePath = path.join(__dirname, "..");
const rendererPath = path.join(basePath, "src", "renderer");
const generatedPath = path.join(rendererPath, "generated");

await rimraf(generatedPath, async e => {
  if (!!e) return echo(chalk.red(e));
  await fs.promises.mkdir(generatedPath);
});

const families = await fs.readdir(path.join(rendererPath, "families"));
const targets = [
  "operationDetails.jsx",
  "accountActions.jsx",
  "TransactionConfirmFields.jsx",
  "AccountBodyHeader.js",
  "AccountSubHeader.jsx",
  "SendAmountFields.jsx",
  "SendRecipientFields.jsx",
  "SendWarning.jsx",
  "ReceiveWarning.jsx",
  "AccountBalanceSummaryFooter.jsx",
  "TokenList.jsx",
  "AccountHeaderManageActions.js",
  "StepReceiveFunds.jsx",
  "NoAssociatedAccounts.jsx",
];

async function genTarget(target) {
  let imports = `// @flow`;
  let exprts = `export default {`;
  const outpath = path.join(generatedPath, target);

  for (const family of families) {
    try {
      await fs.promises.access(
        path.join(rendererPath, "families", family, target),
        fs.constants.R_OK,
      );
      imports += `
import ${family} from "../families/${family}/${target}";`;
      exprts += `
  ${family},`;
    } catch (error) {}
  }

  exprts += `
};
`;

  const str = `${imports}

${exprts}`;

  await fs.promises.writeFile(outpath, str, "utf8");
}

targets.map(genTarget);
