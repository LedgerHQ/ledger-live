#!/usr/bin/env zx
import "zx/globals";
import rimraf from "rimraf";

const basePath = path.join(__dirname, "..");
const rendererPath = path.join(basePath, "src", "renderer");
const generatedPath = path.join(rendererPath, "generated");

await new Promise((resolve, reject) => {
  rimraf(generatedPath, e => {
    if (e) {
      echo(chalk.red(e));
      return reject(e);
    }
    return resolve(fs.promises.mkdir(generatedPath));
  });
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
  const [targetName, extension] = target.split(".");

  for (const family of families) {
    try {
      if (["jsx", "tsx"].includes(extension)) {
        await Promise.any([
          fs.promises.access(
            path.join(rendererPath, "families", family, `${targetName}.jsx`),
            fs.constants.R_OK,
          ),
          fs.promises.access(
            path.join(rendererPath, "families", family, `${targetName}.tsx`),
            fs.constants.R_OK,
          ),
        ]);
      } else {
        await fs.promises.access(
          path.join(rendererPath, "families", family, target),
          fs.constants.R_OK,
        );
      }

      imports += `
import ${family} from "../families/${family}/${targetName}";`;
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
