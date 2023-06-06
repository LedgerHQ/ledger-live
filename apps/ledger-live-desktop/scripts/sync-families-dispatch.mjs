#!/usr/bin/env zx
import "zx/globals";
import fs from "fs";
import path from "path";

const basePath = path.join(__dirname, "..");
const familiesPath = path.join(basePath, "src", "renderer", "families");
const generatedFile = path.join(familiesPath, "generated.ts");

async function gen() {
  const families = (await fs.promises.readdir(familiesPath, { withFileTypes: true }))
    .filter(d => d.isDirectory())
    .map(dirent => dirent.name);

  let imports = 'import { MakeModalsType } from "../modals/types";';
  let modalsData = "";
  let modals = "export const coinModals: MakeModalsType<CoinModalsData> = {\n";
  let exprts = `export default {`;
  for (const family of families) {
    await fs.promises.access(path.join(familiesPath, family, "index.ts"), fs.constants.R_OK);
    imports += `
import ${family} from "../families/${family}/index";`;
    exprts += `
  ${family},`;

    try {
      await fs.promises.access(path.join(familiesPath, family, "modals.ts"), fs.constants.R_OK);
      imports += `
import ${family}Modals, { ModalsData as ${family}ModalsData } from "../families/${family}/modals";`;
      modalsData += `${modalsData ? " &\n  " : ""}${family}ModalsData`;
      modals += "  ..." + family + "Modals,\n";
    } catch (e) {}
  }
  exprts += `\n};`;
  modals += "};";

  const str = `${imports}

${exprts}

export type CoinModalsData = ${modalsData};

${modals}`;

  await fs.promises.writeFile(generatedFile, str, "utf8");
}

gen();
