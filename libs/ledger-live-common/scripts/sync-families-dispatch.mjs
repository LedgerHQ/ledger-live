#!/usr/bin/env zx
import "zx/globals";
import rimraf from "rimraf";

const targets = [
  "customAddressValidation.ts",
  "hw-getAddress.ts",
  "hw-signMessage.ts",
  "transaction.ts",
  "bridge/js.ts",
  "bridge/mock.ts",
  "cli-transaction.ts",
  "specs.ts",
  "deviceTransactionConfig.ts",
  "mock.ts",
  "account.ts",
  "exchange.ts",
  "presync.ts",
  "platformAdapter.ts",
];

cd(path.join(__dirname, "..", "src"));
rimraf.sync("generated");
await fs.promises.mkdir("generated");
await fs.promises.mkdir("generated/bridge");

const families = (
  await fs.promises.readdir("families", { withFileTypes: true })
)
  .filter((dirent) => dirent.isDirectory())
  .map((dirent) => dirent.name);

async function genTarget(targets, families) {
  targets.forEach(async (target) => {
    const imprtTarget = target.replace(".ts", "");
    const outpath = path.join("generated", target);
    let imports = ``;
    let exprts = `export default {`;

    for (const family of families) {
      if (fs.existsSync(path.join("families", family, target))) {
        const subPath = target.split("/");
        let rewind = "../";
        if (subPath.length >= 2) {
          let subs = subPath.length / 2;
          while (subs > 0) {
            rewind += "../";
            subs--;
          }
        }
        imports += `import ${family} from "${rewind}families/${family}/${imprtTarget}";
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
  });
}

async function getDeviceTransactionConfig(families) {
  const outpath = path.join("generated", "deviceTransactionConfig.ts");
  let imports = ``;
  let exprts = `export type ExtraDeviceTransactionField =`;
  for (const family of families) {
    const p = path.join("families", family, "deviceTransactionConfig.ts");
    if (fs.existsSync(p)) {
      const file = await fs.promises.readFile(p, "utf8");
      const hasExports = file.includes(
        "export type ExtraDeviceTransactionField"
      );
      if (hasExports) {
        imports += `import { ExtraDeviceTransactionField as ExtraDeviceTransactionField_${family} } from  "../families/${family}/deviceTransactionConfig";
`;
        exprts += `
  | ExtraDeviceTransactionField_${family}`;
      }
    }
  }

  const str = `${imports}
${exprts};
`;

  await fs.promises.appendFile(outpath, str, "utf8");
}

async function genTypesFile(families) {
  const outpath = path.join("generated", "types.ts");
  let imprts = ``;
  let exprtsT = `export type Transaction =`;
  let exprtsTRaw = `export type TransactionRaw =`;
  let exprtsStatus = `export type TransactionStatus =`;
  let exprtsStatusRaw = `export type TransactionStatusRaw =`;
  for (const family of families) {
    imprts += `import { Transaction as ${family}Transaction } from "../families/${family}/types";
import { TransactionRaw as ${family}TransactionRaw } from "../families/${family}/types";
import { TransactionStatus as ${family}TransactionStatus } from "../families/${family}/types";
import { TransactionStatusRaw as ${family}TransactionStatusRaw } from "../families/${family}/types";
`;
    exprtsT += `
  | ${family}Transaction`;

    exprtsTRaw += `
  | ${family}TransactionRaw`;

    exprtsStatus += `
  | ${family}TransactionStatus`;

    exprtsStatusRaw += `
  | ${family}TransactionStatusRaw`;
  }

  exprtsT += `;
`;
  exprtsTRaw += `;
`;
  exprtsStatus += `;
`;
  exprtsStatusRaw += `;
`;

  const str = `${imprts}
${exprtsT}
${exprtsTRaw}
${exprtsStatus}
${exprtsStatusRaw}`;

  await fs.promises.writeFile(outpath, str, "utf8");
}

await genTarget(targets, families);
await genTypesFile(families);
await getDeviceTransactionConfig(families);
