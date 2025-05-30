#!/usr/bin/env zx
import "zx/globals";
import rimraf from "rimraf";

$.verbose = true; // everything works like in v7

if (os.platform() === "win32") {
  usePowerShell();
}

const basePath = path.join(__dirname, "..", "src");
const generatedPath = path.join(basePath, "generated");

await rimraf(generatedPath);
await fs.promises.mkdir(generatedPath);

const dirContent = await fs.promises.readdir(path.join(basePath, "families"), {
  withFileTypes: true,
});

const families = dirContent.filter(dirent => dirent.isDirectory()).map(dirent => dirent.name);

const targets = [
  "operationDetails",
  "accountActions",
  "TransactionConfirmFields",
  "AccountHeader",
  "AccountBodyHeader",
  "AccountSubHeader",
  "SendRowsCustom",
  "SendRowsFee",
  "AccountBalanceSummaryFooter",
  "SubAccountList",
  "Confirmation",
  "ReceiveConfirmationPostAlert",
  "ConnectDevice",
  "NoAssociatedAccounts",
  "EditOperationPanel",
  "MemoTagInput",
  "MemoTagSummary",
];

async function genTarget(target) {
  let imports = ``;
  let exprts = `export default {`;
  const outpath = path.join(generatedPath, `${target}.ts`);

  for (const family of families) {
    const f = path.join(basePath, "families", family);
    const filesEnt = await fs.promises.readdir(f, { withFileTypes: true });
    const files = filesEnt.filter(ent => !ent.isDirectory()).map(ent => ent.name);
    const file = files.find(f => f.startsWith(target));
    if (file) {
      imports += `import ${family} from "../families/${family}/${target}";
`;
      exprts += `
  ${family},`;
    }
  }

  exprts += `
};
`;

  const str = `${imports}
${exprts}`;

  await fs.promises.writeFile(outpath, str, "utf8");
}

targets.map(genTarget);
