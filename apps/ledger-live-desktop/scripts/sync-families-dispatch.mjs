#!/usr/bin/env zx
import "zx/globals";
import rimraf from "rimraf";

const basePath = path.join(__dirname, "..");
const rendererPath = path.join(basePath, "src", "renderer");
const generatedPath = path.join(rendererPath, "generated");

await rimraf(generatedPath);
await fs.promises.mkdir(generatedPath);

const families = await fs.readdir(path.join(rendererPath, "families"));
const targets = [
  "operationDetails.tsx",
  "accountActions.tsx",
  "TransactionConfirmFields.tsx",
  "AccountBodyHeader.ts",
  "AccountSubHeader.tsx",
  "SendAmountFields.tsx",
  "SendRecipientFields.tsx",
  "SendWarning.tsx",
  "ReceiveWarning.tsx",
  "AccountBalanceSummaryFooter.tsx",
  "TokenList.tsx",
  "AccountHeaderManageActions.ts",
  "StepReceiveFunds.tsx",
  "NoAssociatedAccounts.tsx",
  "live-common-setup.ts",
  "modals.ts",
  "StakeBanner.tsx",
];

async function genTarget(target) {
  let imports = ``;
  let exprts = `export default {`;
  const outpath = path.join(generatedPath, target);
  const [targetName, extension] = target.split(".");

  for (const family of families) {
    try {
      if (["tsx"].includes(extension)) {
        await Promise.any([
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
