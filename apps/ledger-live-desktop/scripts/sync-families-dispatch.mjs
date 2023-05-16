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

  let imports = "";
  let modalsData = "export type CoinModalsData =";
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
import { ModalsData as ${family}ModalsData } from "../families/${family}/modals";`;
      modalsData += `\n  & ${family}ModalsData`;
    } catch (e) {}
  }
  exprts += `\n};`;
  modalsData += ";";

  const str = `${imports}

${exprts}

${modalsData}`;

  await fs.promises.writeFile(generatedFile, str, "utf8");
}

gen();
