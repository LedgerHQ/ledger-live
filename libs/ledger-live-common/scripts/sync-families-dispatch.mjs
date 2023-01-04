#!/usr/bin/env zx
import "zx/globals";
import rimraf from "rimraf";

const targets = [
  "account.ts",
  "bridge/js.ts",
  "bridge/mock.ts",
  "cli-transaction.ts",
  "customAddressValidation.ts",
  "deviceTransactionConfig.ts",
  "exchange.ts",
  "hw-getAddress.ts",
  "hw-signMessage.ts",
  "mock.ts",
  "presync.ts",
  "platformAdapter.ts",
  "specs.ts",
  "transaction.ts",
];

cd(path.join(__dirname, "..", "src"));
await new Promise((resolve, reject) =>
  rimraf("generated", (e) => {
    if (e) {
      echo(chalk.red(e));
      return reject(e);
    }
    resolve();
  })
);
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

    const libsDir = path.join(__dirname, "../..");
    const family = "polkadot";
    if (fs.existsSync(path.join(libsDir, `coin-${family}/src`, target))) {
      imports += `import ${family} from "@ledgerhq/coin-${family}/lib/${imprtTarget}";
`;
      exprts += `
  ${family},`;
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
        imports += `import { ExtraDeviceTransactionField as ExtraDeviceTransactionField_${family} } from "../families/${family}/deviceTransactionConfig";
`;
        exprts += `
  | ExtraDeviceTransactionField_${family}`;
      }
    }
  }

  const libsDir = path.join(__dirname, "../..");
  const family = "polkadot";
  const target = "deviceTransactionConfig.ts";
  if (fs.existsSync(path.join(libsDir, `coin-${family}/src`, target))) {
    imports += `import { ExtraDeviceTransactionField as ExtraDeviceTransactionField_${family} } from "@ledgerhq/coin-${family}/lib/deviceTransactionConfig";
`;
    exprts += `
    | ExtraDeviceTransactionField_${family}`;
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

  const libsDir = path.join(__dirname, "../..");
  const family = "polkadot";
  const target = "types.ts";
  if (fs.existsSync(path.join(libsDir, `coin-${family}/src`, target))) {
    imprts += `import { Transaction as ${family}Transaction } from "@ledgerhq/coin-${family}/lib/types";
import { TransactionRaw as ${family}TransactionRaw } from "@ledgerhq/coin-${family}/lib/types";
import { TransactionStatus as ${family}TransactionStatus } from "@ledgerhq/coin-${family}/lib/types";
import { TransactionStatusRaw as ${family}TransactionStatusRaw } from "@ledgerhq/coin-${family}/lib/types";
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
