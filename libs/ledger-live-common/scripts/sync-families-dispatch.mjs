#!/usr/bin/env zx
import "zx/globals";
import rimraf from "rimraf";

const targets = [
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
  "platformAdapter.ts",
  "walletApiAdapter.ts",
  "operation.ts",
];

// Coins using coin-framework
const familiesWPackage = ["algorand", "evm", "polkadot"];

cd(path.join(__dirname, "..", "src"));
await rimraf("generated");
await fs.promises.mkdir("generated");
await fs.promises.mkdir("generated/bridge");

const families = (await fs.promises.readdir("families", { withFileTypes: true }))
  .filter(dirent => dirent.isDirectory())
  .map(dirent => dirent.name);

async function genTarget(targets, families) {
  targets.forEach(async target => {
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

    const { upImports, upExports } = genCoinFrameworkTarget(target);
    imports += upImports;
    exprts += upExports;

    exprts += `\n};\n`;

    const str = `${imports}
${exprts}`;

    await fs.promises.writeFile(outpath, str, "utf8");
  });
}

function genCoinFrameworkTarget(targetFile) {
  const targetName = targetFile.replace(".ts", "");
  let imports = "";
  let exprts = "";

  // Behavior for coin family with their own package
  const libsDir = path.join(__dirname, "../..");
  for (const family of familiesWPackage) {
    const targetImportPath = `@ledgerhq/coin-${family}/${targetName}`;

    switch (targetFile) {
      case "bridge/js.ts":
        imports += `import { bridge as ${family} } from "../../families/${family}/setup";\n`;
        exprts += `\n  ${family},`;
        break;
      case "cli-transaction.ts":
        imports += `import { cliTools as ${family} } from "../families/${family}/setup";\n`;
        exprts += `\n  ${family},`;
        break;
      case "hw-getAddress.ts":
        imports += `import { resolver as ${family} } from "../families/${family}/setup";\n`;
        exprts += `\n  ${family},`;
        break;
      case "hw-signMessage.ts":
        if (fs.existsSync(path.join(libsDir, `coin-${family}/src`, targetFile))) {
          imports += `import { messageSigner as ${family} } from "../families/${family}/setup";\n`;
          exprts += `\n  ${family},`;
        }
        break;
      // We still use bridge/js file inside "families" directory
      default:
        if (
          fs.existsSync(path.join(libsDir, `coin-${family}/src`, targetFile)) ||
          fs.existsSync(path.join(libsDir, `coin-${family}/src/bridge`, targetFile))
        ) {
          imports += `import ${family} from "${targetImportPath}";\n`;
          exprts += `\n  ${family},`;
        }
    }
  }

  return {
    upImports: imports,
    upExports: exprts,
  };
}

async function getDeviceTransactionConfig(families) {
  const outpath = path.join("generated", "deviceTransactionConfig.ts");
  let imports = ``;
  let exprts = `export type ExtraDeviceTransactionField =`;
  for (const family of families) {
    const p = path.join("families", family, "deviceTransactionConfig.ts");
    if (fs.existsSync(p)) {
      const file = await fs.promises.readFile(p, "utf8");
      const hasExports = file.includes("export type ExtraDeviceTransactionField");
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
    imports += `import { ExtraDeviceTransactionField as ExtraDeviceTransactionField_${family} } from "@ledgerhq/coin-${family}/deviceTransactionConfig";\n`;
    exprts += `\n  | ExtraDeviceTransactionField_${family}`;
  }

  const str = `${imports}
${exprts};
`;

  await fs.promises.appendFile(outpath, str, "utf8");
}

async function genTypesFile(families) {
  const libsDir = path.join(__dirname, "../..");
  const outpath = path.join("generated", "types.ts");
  let imprts = ``;
  let exprtsT = `export type Transaction =`;
  let exprtsTRaw = `export type TransactionRaw =`;
  let exprtsStatus = `export type TransactionStatus =`;
  let exprtsStatusRaw = `export type TransactionStatusRaw =`;
  for (const family of families) {
    const importPath = familiesWPackage.includes(family) ? "@ledgerhq/coin-" : "../families/";
    const typesAsFolder = (() => {
      if (!familiesWPackage.includes(family)) {
        return "";
      }

      if (fs.existsSync(path.join(libsDir, `coin-${family}/src/types/index.ts`))) return "/index";

      return "";
    })();
    imprts += `import { Transaction as ${family}Transaction } from "${importPath}${family}/types${typesAsFolder}";
import { TransactionRaw as ${family}TransactionRaw } from "${importPath}${family}/types${typesAsFolder}";
import { TransactionStatus as ${family}TransactionStatus } from "${importPath}${family}/types${typesAsFolder}";
import { TransactionStatusRaw as ${family}TransactionStatusRaw } from "${importPath}${family}/types${typesAsFolder}";
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
